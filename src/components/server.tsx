import { updateServer } from "@/api/server"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { IconButton } from "@/components/xui/icon-button"
import { conv } from "@/lib/utils"
import { asOptionalField } from "@/lib/utils"
import { ModelServer } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"
import { z } from "zod"

interface ServerCardProps {
    data: ModelServer
    mutate: KeyedMutator<ModelServer[]>
}

const serverFormSchema = z.object({
    name: z.string().min(1),
    note: asOptionalField(z.string()),
    public_note: asOptionalField(z.string()),
    display_index: z.coerce.number().int(),
    hide_for_guest: asOptionalField(z.boolean()),
    enable_ddns: asOptionalField(z.boolean()),
    ddns_profiles: asOptionalField(z.array(z.number())),
    ddns_profiles_raw: asOptionalField(z.string()),
    override_ddns_domains: asOptionalField(z.record(z.coerce.number().int(), z.array(z.string()))),
    override_ddns_domains_raw: asOptionalField(
        z.string().refine(
            (val) => {
                try {
                    JSON.parse(val)
                    return true
                } catch (e) {
                    return false
                }
            },
            {
                message: "Invalid JSON string",
            },
        ),
    ),
})

export const ServerCard: React.FC<ServerCardProps> = ({ data, mutate }) => {
    const { t } = useTranslation()
    const form = useForm<z.infer<typeof serverFormSchema>>({
        resolver: zodResolver(serverFormSchema) as any,
        defaultValues: {
            ...data,
            ddns_profiles_raw: data.ddns_profiles ? conv.arrToStr(data.ddns_profiles) : undefined,
            override_ddns_domains_raw: data.override_ddns_domains
                ? JSON.stringify(data.override_ddns_domains)
                : undefined,
        },
        resetOptions: {
            keepDefaultValues: false,
        },
    })

    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'NZCFG_JSON') {
                if (e.data.target === 'public_note') {
                    form.setValue('public_note', e.data.payload);
                    toast(t("Success"), { description: "配置已通过可视化构建器自动填入" });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [form, t]);

    const onSubmit = async (values: any) => {
        try {
            values.ddns_profiles = values.ddns_profiles_raw
                ? conv.strToArr(values.ddns_profiles_raw).map(Number)
                : undefined
            values.override_ddns_domains = values.override_ddns_domains_raw
                ? JSON.parse(values.override_ddns_domains_raw)
                : undefined
            await updateServer(data!.id!, values)
        } catch (e) {
            console.error(e)
            toast(t("Error"), {
                description: t("Results.UnExpectedError"),
            })
            return
        }
        setOpen(false)
        await mutate()
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <IconButton variant="outline" icon="edit" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <ScrollArea className="max-h-[calc(100dvh-5rem)] p-3">
                    <div className="items-center mx-1">
                        <DialogHeader>
                            <DialogTitle>{t("EditServer")}</DialogTitle>
                            <DialogDescription />
                        </DialogHeader>
                        <Form {...(form as any)}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 my-2">
                                <FormField
                                    control={form.control as any}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Name")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="My Server" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="display_index"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Weight")}</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch("enable_ddns") ? (
                                    <>
                                        <FormField
                                            control={form.control as any}
                                            name="ddns_profiles_raw"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("DDNSProfiles") + t("SeparateWithComma")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="1,2,3" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="override_ddns_domains_raw"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("OverrideDDNSDomains")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea className="resize-y" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <></>
                                )}

                                <FormField
                                    control={form.control as any}
                                    name="enable_ddns"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label className="text-sm">
                                                        {t("EnableDDNS")}
                                                    </Label>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="hide_for_guest"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label className="text-sm">
                                                        {t("HideForGuest")}
                                                    </Label>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Private") + t("Note")}</FormLabel>
                                            <FormControl>
                                                <Textarea className="resize-none" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="public_note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex justify-between items-center w-full">
                                                <span>{t("Public") + t("Note")}</span>
                                                <a href="/dashboard/nzcfg.html" target="_blank" className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1" onClick={(e) => {
                                                    e.preventDefault();
                                                    const popup = window.open('/dashboard/nzcfg.html', 'nzcfg', 'width=1000,height=800');
                                                    if(popup) {
                                                        const timer = setInterval(() => {
                                                            if(popup.closed) {
                                                                clearInterval(timer);
                                                            }
                                                        }, 500);
                                                    }
                                                }}>
                                                    可视化管理配置 <i className="fa-solid fa-up-right-from-square"></i>
                                                </a>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea className="resize-y" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" className="my-2" variant="secondary">
                                            {t("Close")}
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" className="my-2">
                                        {t("Submit")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
