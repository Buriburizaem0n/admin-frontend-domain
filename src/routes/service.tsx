import { swrFetcher } from "@/api/api"
import { Checkbox } from "@/components/ui/checkbox"
import { ServiceCard } from "@/components/xui/service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelService as Service } from "@/types"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import useSWR from "swr"

export default function ServicePage() {
    const columns: ColumnDef<Service>[] = [
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
            header: "ID",
            accessorKey: "id",
            accessorFn: (row) => row.id,
        },
        {
            header: "Name",
            accessorKey: "name",
            accessorFn: (row) => row.name,
        },
        {
            header: "Type",
            accessorKey: "service.type",
            accessorFn: (row) => row.type,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const s = row.original
                return (
                    <>{s.id}</>
                )
            },
        },
    ]

    const { data, error, isLoading } = useSWR<Service[]>('/api/v1/service', swrFetcher)

    const table = useReactTable({
        data: data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return <div className="px-9">
        <div className="flex space-between mt-4 pb-4">
            <h1 className="text-3xl font-bold tracking-tight">
                Service
            </h1>
            <ServiceCard className="ml-auto" />
        </div>
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div >
}