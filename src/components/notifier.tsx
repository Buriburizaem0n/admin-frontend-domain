import { createNotification, updateNotification } from "@/api/notification"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IconButton } from "@/components/xui/icon-button"
import { ModelNotification } from "@/types"
import { nrequestMethods, nrequestTypes } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { KeyedMutator } from "swr"
import { z } from "zod"

import { Textarea } from "./ui/textarea"

interface NotifierCardProps {
    data?: ModelNotification
    mutate: KeyedMutator<ModelNotification[]>
}

const notificationFormSchema = z.object({
    name: z.string().min(1),
    url: z.string().default(""),
    request_method: z.coerce.number().int().default(1),
    request_type: z.coerce.number().int().default(1),
    request_header: z.string(),
    request_body: z.string(),
    verify_tls: z.boolean().default(false),
    skip_check: z.boolean().default(false),
    format_metric_units: z.boolean().default(false),
    type: z.coerce.number().int().default(1),
})

export const NotifierCard: React.FC<NotifierCardProps> = ({ data, mutate }) => {
    const { t } = useTranslation()
    type NotificationFormInput = z.input<typeof notificationFormSchema>
    type NotificationFormData = z.output<typeof notificationFormSchema>
    type NotificationDefaults = ModelNotification &
        Partial<Pick<NotificationFormData, "skip_check">>
    const notificationDefaults: NotificationDefaults | undefined = data

    const form = useForm<NotificationFormInput, unknown, NotificationFormData>({
        resolver: zodResolver(notificationFormSchema),
        defaultValues: data
            ? {
                  name: data.name ?? "",
                  url: data.url ?? "",
                  request_method: data.request_method ?? 1,
                  request_type: data.request_type ?? 1,
                  request_header: data.request_header ?? "",
                  request_body: data.request_body ?? "",
                  verify_tls: data.verify_tls ?? false,
                  skip_check: notificationDefaults?.skip_check ?? false,
                  format_metric_units: data.format_metric_units ?? false,
                  type: (data as any)?.type ?? 1,
              }


            : {
                  name: "",
                  url: "",
                  request_method: 1,
                  request_type: 1,
                  request_header: "",
                  request_body: "",
                  verify_tls: false,
                  skip_check: false,
                  format_metric_units: false,
                  type: 1,
              },
        resetOptions: {
            keepDefaultValues: false,
        },
    })

    const [open, setOpen] = useState(false)

    const onSubmit = async (values: NotificationFormData) => {
        try {
            if (data?.id) {
                await updateNotification(data.id, values)
            } else {
                await createNotification(values)
            }
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
                {data ? <IconButton variant="outline" icon="edit" /> : <IconButton icon="plus" />}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <ScrollArea className="max-h-[calc(100dvh-5rem)] p-3">
                    <div className="items-center mx-1">
                        <DialogHeader>
                            <DialogTitle>
                                {data ? t("EditNotifier") : t("CreateNotifier")}
                            </DialogTitle>
                            <DialogDescription />
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 my-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("Name")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="My Notifier" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notification Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={`${field.value}`}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1">Webhook</SelectItem>
                                                    <SelectItem value="2">Email (Global)</SelectItem>
                                                    <SelectItem value="3">Telegram (Global)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.watch("type") == 1 && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>URL</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="https://..."
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="request_method"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("RequestMethod")}</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={`${field.value}`}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Request Method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {Object.entries(nrequestMethods).map(
                                                                ([k, v]) => (
                                                                    <SelectItem key={k} value={k}>
                                                                        {v}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="request_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("Type")}</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={`${field.value}`}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Request Type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {Object.entries(nrequestTypes).map(
                                                                ([k, v]) => (
                                                                    <SelectItem key={k} value={k}>
                                                                        {v}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="request_header"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("RequestHeader")}</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            className="resize-y"
                                                            placeholder={'{"User-Agent":"Nezha-Agent"}'}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                                <FormField
                                    control={form.control}
                                    name="request_body"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("RequestBody")}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className="resize-y h-[240px]"
                                                    placeholder="..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="pt-4 border-t space-y-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t("AdvancedSettings")}
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                        {form.watch("type") == 1 && (
                                            <FormField
                                                control={form.control}
                                                name="verify_tls"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0 py-1">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                                            {t("VerifyTLS")}
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        <FormField
                                            control={form.control}
                                            name="skip_check"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 space-y-0 py-1">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                        {t("DoNotSendTestMessage")}
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="format_metric_units"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-2 space-y-0 py-1">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                        {t("FormatMetricUnits")}
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" className="my-2" variant="secondary">
                                            {t("Close")}
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" className="my-2">
                                        {t("Confirm")}
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
