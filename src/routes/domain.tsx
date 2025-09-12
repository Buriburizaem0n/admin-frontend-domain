// src/routes/domain.tsx (最终完整版)

import { useState, useEffect } from 'react'
import { PlusCircle, RefreshCw, MoreVertical, Trash2, Edit, CheckCircle } from 'lucide-react'

// 导入 shadcn/ui 组件
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from "@/components/ui/switch"

import { toast } from 'sonner'

// 导入 API 类型和函数
import type { Domain, BillingDataMod } from '@/types/api'
import { useDomainList, addDomain, verifyDomain, deleteDomain, updateDomain } from '@/api/domain'
import useSWR from 'swr'


export default function DomainPage() {
  // --- React State Hooks ---
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 添加弹窗状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  
  // 验证信息弹窗状态
  const [verificationToken, setVerificationToken] = useState('')
  const [isVerificationInfoModalOpen, setIsVerificationInfoModalOpen] = useState(false)

  // 编辑弹窗状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentDomain, setCurrentDomain] = useState<Domain | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<BillingDataMod>>({})

  // --- 数据获取 (使用 SWR) ---
  const { data: domainData, error, mutate } = useSWR('/api/v1/domains', useDomainList, { revalidateOnFocus: false })

  useEffect(() => {
    if (domainData) {
      // 过滤掉 pending 状态的域名，因为公开页面不显示它们
      const visibleDomains = domainData.filter(d => d.Status === 'verified' || d.Status === 'expired')
      setDomains(visibleDomains)
      setIsLoading(false)
    }
    if (error) {
      toast.error('无法加载域名列表，请检查后端服务是否正常。')
      setIsLoading(false)
    }
  }, [domainData, error])

  // --- 事件处理函数 ---
  const handleAddDomain = async () => {
    if (!newDomainName) {
      toast.error('请输入域名')
      return
    }
    try {
      const response = await addDomain(newDomainName)
      setVerificationToken(response.VerifyToken)
      setIsAddModalOpen(false)
      setIsVerificationInfoModalOpen(true)
      setNewDomainName('')
      mutate()
    } catch (err) {
      toast.error('添加失败', { description: (err as Error).message })
    }
  }

  const handleVerify = async (domainId: number) => {
    try {
      const response = await verifyDomain(domainId)
      if (response.success) {
        toast.success('验证成功', { description: response.message })
      } else {
        toast.warning('验证失败', { description: response.message })
      }
      setTimeout(() => mutate(), 2000)
    } catch (err) {
      toast.error('操作失败', { description: (err as Error).message })
    }
  }

  const handleDelete = async (domainId: number, domainName: string) => {
    if (window.confirm(`确定要删除域名 ${domainName} 吗？`)) {
      try {
        await deleteDomain(domainId)
        toast.success('删除成功', { description: `域名 ${domainName} 已被删除。` })
        mutate()
      } catch (err) {
        toast.error('删除失败', { description: (err as Error).message })
      }
    }
  }
  
  const handlePublicToggle = async (domain: Domain) => {
    try {
      await updateDomain(domain.ID, {
        is_public: !domain.IsPublic,
        billing_data: domain.BillingData as BillingDataMod,
      })
      toast.success(`域名 ${domain.Domain} 的可见状态已更新`)
      mutate() // 刷新列表以显示最新状态
    } catch (err) {
      toast.error('更新失败', { description: (err as Error).message })
    }
  }

  const handleEditClick = (domain: Domain) => {
    setCurrentDomain(domain)
    setEditFormData(domain.BillingData || {})
    setIsEditModalOpen(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    })
  }

  const handleUpdateDomain = async () => {
    if (!currentDomain) return
    try {
      const dataToSend = { ...editFormData };
      // 将 HTML date input 的 'YYYY-MM-DD' 格式转换为后端需要的 ISO 字符串格式
      if (dataToSend.registeredDate) {
        dataToSend.registeredDate = new Date(dataToSend.registeredDate).toISOString();
      }
      if (dataToSend.endDate) {
        dataToSend.endDate = new Date(dataToSend.endDate).toISOString();
      }

      await updateDomain(currentDomain.ID, {
        is_public: currentDomain.IsPublic,
        billing_data: dataToSend as BillingDataMod
      })
      toast.success('更新成功', { description: `域名 ${currentDomain.Domain} 的配置已保存。` })
      setIsEditModalOpen(false)
      mutate()
    } catch (err) {
      toast.error('更新失败', { description: (err as Error).message })
    }
  }

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'verified': return 'default'
      case 'pending': return 'secondary'
      case 'expired': return 'destructive'
      default: return 'outline'
    }
  }

  // --- JSX 渲染 ---
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>域名监控</CardTitle>
            <CardDescription>管理并监控您的域名到期状态。</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => mutate()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />添加域名</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新域名</DialogTitle>
                  <DialogDescription>输入您需要监控的域名，例如 "example.com"。</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input value={newDomainName} onChange={(e) => setNewDomainName(e.target.value)} placeholder="your-domain.com" onKeyUp={(e) => e.key === 'Enter' && handleAddDomain()} />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>取消</Button>
                  <Button onClick={handleAddDomain}>提交</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? ( <div className="text-center py-10 text-muted-foreground">加载中...</div> ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>域名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>剩余天数</TableHead>
                  <TableHead>公开</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.ID}>
                    <TableCell className="font-medium">{domain.Domain}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(domain.Status)}>{domain.Status}</Badge></TableCell>
                    <TableCell>{domain.expires_in_days ?? 'N/A'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={domain.IsPublic}
                        onCheckedChange={() => handlePublicToggle(domain)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {domain.Status === 'pending' && (<DropdownMenuItem onClick={() => handleVerify(domain.ID)}><CheckCircle className="mr-2 h-4 w-4" /> 验证</DropdownMenuItem>)}
                          <DropdownMenuItem onClick={() => handleEditClick(domain)}><Edit className="mr-2 h-4 w-4" /> 编辑</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(domain.ID, domain.Domain)}><Trash2 className="mr-2 h-4 w-4" /> 删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isVerificationInfoModalOpen} onOpenChange={setIsVerificationInfoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请验证域名所有权</DialogTitle>
            <DialogDescription>为了开始监控，请为您的域名添加一条 DNS TXT 记录。</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p>请将以下内容添加到您的 DNS 解析记录中：</p>
            <div className="p-2 bg-muted rounded-md text-sm">
              <p><span className="font-semibold">类型:</span> TXT</p>
              <p><span className="font-semibold">主机/名称:</span> @</p>
              <p className="font-semibold">记录值:</p>
              <p className="font-mono bg-background p-2 rounded">{verificationToken}</p>
            </div>
            <p className="text-xs text-muted-foreground">DNS 记录生效可能需要几分钟到几小时不等。生效后，请回到域名列表点击“验证”。</p>
          </div>
          <DialogFooter><Button onClick={() => setIsVerificationInfoModalOpen(false)}>我明白了</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑域名信息</DialogTitle>
            <DialogDescription>为 <span className="font-mono">{currentDomain?.Domain}</span> 添加或修改详细信息。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="registrar" className="text-right">注册商</Label><Input id="registrar" name="registrar" value={editFormData.registrar || ''} onChange={handleEditFormChange} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="registeredDate" className="text-right">注册日期</Label><Input id="registeredDate" name="registeredDate" type="date" value={editFormData.registeredDate?.split('T')[0] || ''} onChange={handleEditFormChange} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="endDate" className="text-right">到期日期</Label><Input id="endDate" name="endDate" type="date" value={editFormData.endDate?.split('T')[0] || ''} onChange={handleEditFormChange} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="renewalPrice" className="text-right">续费价格</Label><Input id="renewalPrice" name="renewalPrice" value={editFormData.renewalPrice || ''} onChange={handleEditFormChange} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="notes" className="text-right">备注</Label><Textarea id="notes" name="notes" value={editFormData.notes || ''} onChange={handleEditFormChange} className="col-span-3" /></div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>取消</Button>
            <Button onClick={handleUpdateDomain}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}