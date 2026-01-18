"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"

// Sample data type
export type Payment = {
    id: string
    amount: number
    status: "pending" | "processing" | "success" | "failed"
    email: string
}

// Sample data
const data: Payment[] = [
    {
        id: "m5gr84i9",
        amount: 316,
        status: "success",
        email: "ken99@yahoo.com",
    },
    {
        id: "3u1reuv4",
        amount: 242,
        status: "success",
        email: "Abe45@gmail.com",
    },
    {
        id: "derv1ws0",
        amount: 837,
        status: "processing",
        email: "Monserrat44@gmail.com",
    },
    {
        id: "5kma53ae",
        amount: 874,
        status: "success",
        email: "Silas22@gmail.com",
    },
    {
        id: "bhqecj4p",
        amount: 721,
        status: "failed",
        email: "carmella@hotmail.com",
    },
]

// Column definitions
export const columns: ColumnDef<Payment>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <div className="flex w-[100px] items-center">
                    <span className="capitalize">{status}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))

            // Format the amount as a dollar amount
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const payment = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.id)}
                        >
                            Copy payment ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View customer</DropdownMenuItem>
                        <DropdownMenuItem>View payment details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export function DataTableDemo() {
    const [tableData] = React.useState<Payment[]>(data)

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={tableData} />
        </div>
    )
}

// Example with toolbar and pagination
export function DataTableDemoWithToolbar() {
    const [tableData] = React.useState<Payment[]>(data)
    const [sorting, setSorting] = React.useState([])
    const [columnFilters, setColumnFilters] = React.useState([])
    const [columnVisibility, setColumnVisibility] = React.useState({})
    const [rowSelection, setRowSelection] = React.useState({})

    return (
        <div className="container mx-auto py-10">
            <div className="space-y-4">
                <DataTableToolbar
                    table={null as any}
                    searchKey="email"
                    searchPlaceholder="Search emails..."
                />
                <DataTable columns={columns} data={tableData} />
                <DataTablePagination table={null as any} />
            </div>
        </div>
    )
}
