import { updateServer } from "@/api/server"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { IconButton } from "@/components/xui/icon-button"
import { ModelServer as Server } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"
import { z } from "zod"

interface BatchEditNoteIconProps {
    servers: Server[]
    selectedIds: number[]
    mutate: KeyedMutator<Server[]>
}

const batchNoteFormSchema = z.object({
    note: z.string().optional(),
    public_note: z.string().optional(),
})

export const BatchEditNoteIcon: React.FC<BatchEditNoteIconProps> = ({
    servers,
    selectedIds,
    mutate,
}) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof batchNoteFormSchema>>({
        resolver: zodResolver(batchNoteFormSchema),
        defaultValues: {
            note: "",
            public_note: "",
        },
    })

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === "NZCFG_JSON") {
                const target = e.data.target === "traffic" ? "public_note" : e.data.target
                if (target === "public_note" || target === "note") {
                    form.setValue(target, e.data.payload)
                    toast(t("Success"), {
                        description: `批量配置已自动填入${
                            target === "public_note" ? t("PublicNote.Label") : t("Private") + t("Note")
                        }`,
                    })
                }
            }
        }
        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
    }, [form, t])

    const onSubmit = async (values: z.infer<typeof batchNoteFormSchema>) => {
        if (selectedIds.length === 0) {
            toast(t("Error"), { description: t("Results.SelectAtLeastOneServer") })
            return
        }

        const promises = selectedIds.map((id) => {
            const server = servers.find((s) => s.id === id)
            if (!server) return Promise.resolve()
            
            // Only update note/public_note if the batch form field is not empty!
            // Wait, what if they WANT to clear the note? 
            // For batch, usually we only override if they typed something.
            // We can provide a checkbox or just update if not empty.
            // Let's just update if not empty for safety.
            const updatePayload = {
                ...server,
                note: values.note && values.note.trim() !== "" ? values.note : server.note,
                public_note: values.public_note && values.public_note.trim() !== "" ? values.public_note : server.public_note,
            }

            
            // Clean up non-API fields
            return updateServer(id, {
                name: updatePayload.name,
                display_index: updatePayload.display_index,
                note: updatePayload.note,
                public_note: updatePayload.public_note,
                hide_for_guest: updatePayload.hide_for_guest,
                enable_ddns: updatePayload.enable_ddns,
                ddns_profiles: updatePayload.ddns_profiles,
                override_ddns_domains: updatePayload.override_ddns_domains,
            })
        })

        toast.promise(Promise.all(promises), {
            loading: t("Saving..."),
            success: () => {
                setOpen(false)
                mutate()
                form.reset()
                return t("Success")
            },
            error: t("Results.UnExpectedError"),
        })
    }

    return (
        <>
            <IconButton
                icon="edit"
                onClick={() => {
                    if (selectedIds.length === 0) {
                        toast(t("Error"), { description: t("Results.SelectAtLeastOneServer") })
                        return
                    }
                    setOpen(true)
                }}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>批量修改配置/备注 (已选 {selectedIds.length} 台)</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex justify-between items-center w-full">
                                            <span>{t("Private") + t("Note")} (留空则不修改)</span>
                                            <Button
                                                variant="link"
                                                type="button"
                                                className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 h-auto p-0"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    window.open(
                                                        "/dashboard/nzcfg.html?target=note",
                                                        "nzcfg",
                                                        "width=1000,height=800",
                                                    )
                                                }}
                                            >
                                                可视化管理配置 <i className="fa-solid fa-up-right-from-square"></i>
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="resize-none"
                                                placeholder="在此粘贴或使用右上角可视化工具生成配置..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="public_note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex justify-between items-center w-full">
                                            <span>{t("Public") + t("Note")} (留空则不修改)</span>
                                            <Button
                                                variant="link"
                                                type="button"
                                                className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 h-auto p-0"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    window.open(
                                                        "/dashboard/nzcfg.html?target=public_note",
                                                        "nzcfg",
                                                        "width=1000,height=800",
                                                    )
                                                }}
                                            >
                                                可视化管理配置 <i className="fa-solid fa-up-right-from-square"></i>
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="resize-y"
                                                placeholder="在此粘贴或使用右上角可视化工具生成配置..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        {t("Close")}
                                    </Button>
                                </DialogClose>
                                <Button type="submit">{t("Submit")}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}
