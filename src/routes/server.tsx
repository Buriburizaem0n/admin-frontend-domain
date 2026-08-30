import { swrFetcher } from "@/api/api"
import { deleteServer, forceUpdateServer } from "@/api/server"
import { ActionButtonGroup } from "@/components/action-button-group"
import { BatchMoveServerIcon } from "@/components/batch-move-server-icon"
import { CopyButton } from "@/components/copy-button"
import { HeaderButtonGroup } from "@/components/header-button-group"
import { InstallCommandsMenu } from "@/components/install-commands"
import { NoteMenu } from "@/components/note-menu"
import { ServerCard } from "@/components/server"
import { ServerConfigCard } from "@/components/server-config"
import { ServerConfigCardBatch } from "@/components/server-config-batch"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IconButton } from "@/components/xui/icon-button"
import { useServer } from "@/hooks/useServer"
import { selectableTableFeatures } from "@/lib/table"
import { joinIP } from "@/lib/utils"
import { ModelServerTaskResponse, ModelServer as Server } from "@/types"
import { ColumnDef, flexRender, useTable } from "@tanstack/react-table"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import useSWR from "swr"

export default function ServerPage() {
    const { t } = useTranslation()
    const { data, mutate, error, isLoading } = useSWR<Server[]>("/api/v1/server", swrFetcher, {
        revalidateOnFocus: false,
    })
    const { serverGroups } = useServer()

    useEffect(() => {
        if (error)
            toast(t("Error"), {
                description: t("Results.ErrorFetchingResource", { error: error.message }),
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const columns = useMemo<ColumnDef<typeof selectableTableFeatures, Server>[]>(
        () => [
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
                enableHiding: false,
            },
            {
                header: "ID",
                accessorKey: "id",
                accessorFn: (row) => `${row.id}(${row.display_index})`,
            },
            {
                header: t("Name"),
                accessorKey: "name",
                accessorFn: (row) => row.name,
                cell: ({ row }) => {
                    const s = row.original
                    return <div className="max-w-24 whitespace-normal break-words">{s.name}</div>
                },
            },
            {
                id: "owner",
                header: t("Owner"),
                accessorFn: (row) => {
                    if (!row.owner) return ""
                    if (row.owner.id === 0) return t("GlobalAgent")
                    return row.owner.username || t("UnknownUser", { id: row.owner.id })
                },
                cell: ({ row }) => {
                    const owner = row.original.owner
                    if (!owner) {
                        return <span className="text-muted-foreground">-</span>
                    }
                    if (owner.id === 0) {
                        return <span>{t("GlobalAgent")}</span>
                    }
                    const label = owner.username || t("UnknownUser", { id: owner.id })
                    return (
                        <div
                            className="max-w-32 whitespace-normal break-words"
                            title={`uid=${owner.id}`}
                        >
                            {label}
                        </div>
                    )
                },
            },
            {
                header: t("Group"),
                accessorKey: "groups",
                accessorFn: (row) => {
                    return (
                        serverGroups
                            ?.filter((sg) => sg.servers?.includes(row.id!))
                            .map((sg) => sg.group.id) || []
                    )
                },
            },
            {
                id: "ip",
                header: "IP",
                cell: ({ row }) => {
                    const s = row.original
                    return (
                        <div className="max-w-24 whitespace-normal break-words">
                            {joinIP(s.geoip?.ip)}
                        </div>
                    )
                },
            },
            {
                header: t("Version"),
                accessorKey: "host.version",
                accessorFn: (row) => row.host?.version || t("Unknown"),
            },
            {
                header: t("EnableDDNS"),
                accessorKey: "enableDDNS",
                accessorFn: (row) => row.enable_ddns ?? false,
            },
            {
                header: t("HideForGuest"),
                accessorKey: "hideForGuest",
                accessorFn: (row) => row.hide_for_guest ?? false,
            },
            {
                id: "note",
                header: t("Note"),
                cell: ({ row }) => {
                    const s = row.original
                    return <NoteMenu note={{ private: s.note, public: s.public_note }} />
                },
            },
            {
                id: "uuid",
                header: "UUID",
                cell: ({ row }) => {
                    const s = row.original
                    return <CopyButton text={s.uuid} />
                },
            },
            {
                id: "actions",
                header: t("Actions"),
                cell: ({ row }) => {
                    const s = row.original
                    return (
                        <ActionButtonGroup
                            className="flex gap-2"
                            delete={{ fn: deleteServer, id: s.id!, mutate: mutate }}
                        >
                            <>
                                <ServerCard mutate={mutate} data={s} />
                                <ServerConfigCard sid={s.id!} variant="outline" />
                            </>
                        </ActionButtonGroup>
                    )
                },
            },
        ],
        [t, mutate, serverGroups],
    )

    const dataCache = useMemo(() => {
        return data ?? []
    }, [data])

    const table = useTable({
        features: selectableTableFeatures,
        data: dataCache,
        columns,
    })

    const selectedRows = table.getSelectedRowModel().rows

    return (
        <div className="px-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 mt-6 mb-4">
                <h1 className="text-3xl font-bold tracking-tight shrink-0">{t("Server")}</h1>
                <HeaderButtonGroup
                    className="flex items-center gap-2 flex-wrap shrink-0 sm:ml-auto"
                    delete={{
                        fn: deleteServer,
                        id: selectedRows.map((r) => r.original.id).filter(Boolean) as number[],
                        mutate: mutate,
                    }}
                >
                    <IconButton
                        icon="update"
                        onClick={async () => {
                            const id = selectedRows.map((r) => r.original.id) as number[]
                            if (id.length < 1) {
                                toast(t("Error"), {
                                    description: t("Results.SelectAtLeastOneServer"),
                                })
                                return
                            }

                            let resp: ModelServerTaskResponse = {}
                            try {
                                resp = await forceUpdateServer(id)
                            } catch (e) {
                                console.error(e)
                                toast(t("Error"), {
                                    description: t("Results.UnExpectedError"),
                                })
                                return
                            }
                            toast(t("Done"), {
                                description:
                                    t("Results.ForceUpdate") +
                                    (resp.success?.length
                                        ? t(`Success`) + ` [${resp.success.join(",")}]`
                                        : "") +
                                    (resp.failure?.length
                                        ? t(`Failure`) + ` [${resp.failure.join(",")}]`
                                        : "") +
                                    (resp.offline?.length
                                        ? t(`Offline`) + ` [${resp.offline.join(",")}]`
                                        : ""),
                            })
                        }}
                    />
                    <BatchMoveServerIcon
                        serverIds={selectedRows.map((r) => r.original.id) as number[]}
                    />
                    <ServerConfigCardBatch
                        sid={selectedRows.map((r) => r.original.id) as number[]}
                        className="shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-yellow-600 text-white hover:bg-yellow-500 dark:hover:bg-yellow-700 rounded-lg"
                    />
                    <InstallCommandsMenu className="shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-800 rounded-lg" />
                </HeaderButtonGroup>
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="text-sm">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("Loading")}...
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="text-xsm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {t("NoResults")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
