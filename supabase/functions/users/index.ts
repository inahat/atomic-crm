import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

async function updateSaleRecord(
  user_id: string,
  disabled: boolean,
  administrator: boolean,
  role?: string,
) {
  const userRole = role || (administrator ? "admin" : "user");
  const isAdmin = userRole === "admin";

  const updatePayload: Record<string, any> = {
    disabled: disabled ?? false,
    administrator: isAdmin,
    role: userRole,
  };

  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .update(updatePayload)
    .eq("user_id", user_id)
    .select("*");

  if (!sales?.length || salesError) {
    console.error("Error updating sales record:", salesError);

    // Fallback: check if sales record exists
    const { data: existingSale } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!existingSale) {
      const { data: newSale, error: insertError } = await supabaseAdmin
        .from("sales")
        .insert({
          user_id,
          administrator: isAdmin,
          disabled: disabled ?? false,
          role: userRole,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return newSale;
    }

    throw salesError ?? new Error("Failed to update sale record");
  }

  return sales[0];
}

async function updateSaleAvatar(user_id: string, avatar: string) {
  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .update({ avatar })
    .eq("user_id", user_id)
    .select("*");

  if (!sales?.length || salesError) {
    console.error("Error updating user avatar:", salesError);
    throw salesError ?? new Error("Failed to update sale avatar");
  }
  return sales[0];
}

async function inviteUser(req: Request, currentUserSale: any) {
  const { email, password, first_name, last_name, disabled, administrator, role } =
    await req.json();

  if (!currentUserSale.administrator) {
    return createErrorResponse(401, "Not Authorized");
  }

  let createdUser: any = null;

  if (password) {
    const { data, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });

    if (!data?.user || userError) {
      console.error(`Error creating user:`, userError);
      return createErrorResponse(400, userError?.message || "Failed to create user");
    }
    createdUser = data.user;
  } else {
    // Attempt invite email first
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { first_name, last_name },
      });

    if (inviteError || !inviteData?.user) {
      console.warn(
        `inviteUserByEmail failed: ${inviteError?.message || "No user returned"}. Falling back to createUser.`,
      );
      // Fallback to createUser if email provider/SMTP fails
      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { first_name, last_name },
        });

      if (!createData?.user || createError) {
        console.error(`Error creating user fallback:`, createError);
        return createErrorResponse(
          400,
          createError?.message || inviteError?.message || "Failed to create user",
        );
      }
      createdUser = createData.user;
    } else {
      createdUser = inviteData.user;
    }
  }

  try {
    const sale = await updateSaleRecord(
      createdUser.id,
      disabled,
      administrator,
      role,
    );

    return new Response(
      JSON.stringify({
        data: sale,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e: any) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, e?.message || "Internal Server Error");
  }
}

async function patchUser(req: Request, currentUserSale: any) {
  const {
    sales_id,
    email,
    first_name,
    last_name,
    avatar,
    administrator,
    role,
    disabled,
  } = await req.json();

  const { data: sale } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("id", sales_id)
    .single();

  if (!sale) {
    return createErrorResponse(404, "Not Found");
  }

  // Users can only update their own profile unless they are an administrator
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized");
  }

  const { data, error: userError } =
    await supabaseAdmin.auth.admin.updateUserById(sale.user_id, {
      email,
      ban_duration: disabled ? "87600h" : "none",
      user_metadata: { first_name, last_name },
    });

  if (!data?.user || userError) {
    console.error("Error patching user:", userError);
    return createErrorResponse(500, userError?.message || "Internal Server Error");
  }

  if (avatar) {
    await updateSaleAvatar(data.user.id, avatar);
  }

  // Ensure the sales record is also updated with the new name
  const { error: salesUpdateError } = await supabaseAdmin
    .from("sales")
    .update({ first_name, last_name })
    .eq("id", sales_id);

  if (salesUpdateError) {
    console.error("Error updating sales record:", salesUpdateError);
    return createErrorResponse(500, "Failed to update profile details");
  }

  // Only administrators can update the administrator and disabled status
  if (!currentUserSale.administrator) {
    const { data: new_sale } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", sales_id)
      .single();
    return new Response(
      JSON.stringify({
        data: new_sale,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  try {
    const updatedSale = await updateSaleRecord(
      data.user.id,
      disabled,
      administrator,
      role,
    );
    return new Response(
      JSON.stringify({
        data: updatedSale,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (e: any) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, e?.message || "Internal Server Error");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse(401, "Missing Authorization Header");
  }
  const token = authHeader.replace("Bearer ", "");

  const apiKey = Deno.env.get("ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const localClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? Deno.env.get("API_URL") ?? "",
    apiKey,
    { global: { headers: { Authorization: authHeader } } },
  );

  // Explicitly verify the token
  const { data, error: authError } = await localClient.auth.getUser(token);
  if (!data?.user) {
    return createErrorResponse(401, `Auth User Failed: ${JSON.stringify(authError)}`);
  }

  const { data: saleData, error: saleError } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  if (!saleData || saleError) {
    console.error("Sale lookup error:", saleError);
    return createErrorResponse(
      401,
      `Sales Lookup Failed: ${saleError?.message || "No sale record found for user"} (Ref: ${data.user.id})`,
    );
  }

  const currentUserSale = { data: saleData };

  if (req.method === "POST") {
    return inviteUser(req, currentUserSale.data);
  }

  if (req.method === "PATCH") {
    return patchUser(req, currentUserSale.data);
  }

  return createErrorResponse(405, "Method Not Allowed");
});
