
// Helper to get a text representation of the database schema
export async function getDatabaseSchema(supabase: any) {
    const { data, error } = await supabase
        .rpc('exec_sql_readonly', {
            sql_query: `
        SELECT 
          table_name, 
          string_agg(column_name || ' (' || data_type || ')', ', ') as columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        GROUP BY table_name
      `
        });

    if (error) {
        console.error("Error fetching schema:", error);
        return "Error fetching schema. Please ask the user for table details.";
    }

    // Parse the JSON result from our RPC (it returns an array of objects)
    // The RPC returns jsonb, so 'data' is the result.
    // Wait, exec_sql_readonly returns `select json_agg(...)`.
    // So data will be `[ { "table_name": "...", "columns": "..." }, ... ]` if properly unpacked?
    // Actually the RPC returns the raw JSONB result of the query.
    // Let's look at the RPC again: `execute 'select json_agg(t) from (' || sql_query || ') t' into result;`
    // So it returns an array of rows.

    if (!data || !Array.isArray(data)) {
        return "No schema found.";
    }

    return data.map((table: any) => {
        return `Table: ${table.table_name}\nColumns: ${table.columns}`;
    }).join("\n\n");
}
