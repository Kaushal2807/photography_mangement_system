"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from '@/lib/axios';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useStudioSettings, useUpdateStudioSettings, useInvoiceSettings, useUpdateInvoiceSettings, useAccount, useUpdateAccount, useChangePassword } from "@/hooks/useSettings";
 

const studioSchema = z.object({
  studioName: z.string().min(1, "Studio name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  mobile: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

type UpdateStudioDto = z.infer<typeof studioSchema>;

export default function SettingsPage() {
  const { data: studioData, isLoading: loadingStudio, refetch: refetchStudio } = useStudioSettings();
  const updateStudio = useUpdateStudioSettings();
  const { data: invoiceData } = useInvoiceSettings();
  const updateInvoice = useUpdateInvoiceSettings();
  const { data: accountData } = useAccount();
  const updateAccount = useUpdateAccount();
  const changePassword = useChangePassword();

  const form = useForm<UpdateStudioDto>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      studioName: '',
      ownerName: '',
      mobile: '',
      email: '',
      address: '',
      gstNumber: '',
    },
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoicePrefix: 'INV',
    invoiceStartingNumber: 1,
    defaultTaxPercentage: 0,
    invoiceTerms: '',
    invoiceFooter: '',
  });

  useEffect(() => {
    if (invoiceData?.data) {
      setInvoiceForm({
        invoicePrefix: invoiceData.data.invoicePrefix ?? 'INV',
        invoiceStartingNumber: invoiceData.data.invoiceStartingNumber ?? 1,
        defaultTaxPercentage: invoiceData.data.defaultTaxPercentage ?? 0,
        invoiceTerms: invoiceData.data.invoiceTerms ?? '',
        invoiceFooter: invoiceData.data.invoiceFooter ?? '',
      });
    }
  }, [invoiceData]);

  const [accountForm, setAccountForm] = useState({ name: '', mobile: '', email: '' });
  useEffect(() => {
    if (accountData?.data) {
      setAccountForm({ name: accountData.data.name ?? '', mobile: accountData.data.mobile ?? '', email: accountData.data.email ?? '' });
    }
  }, [accountData]);

  useEffect(() => {
    if (studioData?.data) {
      form.reset({
        studioName: studioData.data.studioName,
        ownerName: studioData.data.ownerName,
        mobile: studioData.data.mobile,
        email: studioData.data.email,
        address: studioData.data.address,
        gstNumber: studioData.data.gstNumber,
      });
    }
  }, [studioData, form]);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    studioData?.data?.logoUrl ? `${API_BASE_URL ?? ''}/invoice/logo/file` : null,
  );

  useEffect(() => {
    if (studioData?.data?.logoUrl) {
      setLogoPreviewUrl(`${API_BASE_URL ?? ''}/invoice/logo/file`);
    }
  }, [studioData]);

  const onSubmitStudio = async (values: UpdateStudioDto) => {
    await updateStudio.mutateAsync(values);
    window.location.reload();
  };

  const onSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      invoicePrefix: invoiceForm.invoicePrefix || undefined,
      invoiceStartingNumber: Number(invoiceForm.invoiceStartingNumber) || undefined,
      defaultTaxPercentage: Number(invoiceForm.defaultTaxPercentage) || undefined,
      invoiceTerms: invoiceForm.invoiceTerms || undefined,
      invoiceFooter: invoiceForm.invoiceFooter || undefined,
    };
    await updateInvoice.mutateAsync(payload);
    window.location.reload();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-slate-500">Manage your studio and application settings.</p>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Studio Profile</CardTitle>
            <CardDescription>Studio information used across the app and invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmitStudio)} className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Studio Name</label>
                <Input className="mt-1" {...form.register('studioName')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Owner Name</label>
                <Input className="mt-1" {...form.register('ownerName')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Mobile</label>
                <Input className="mt-1" {...form.register('mobile')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email</label>
                <Input className="mt-1" {...form.register('email')} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Address</label>
                <Textarea className="mt-1" {...form.register('address')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">GST Number</label>
                <Input className="mt-1" {...form.register('gstNumber')} />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Studio Logo</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onKeyDown={(e) => {
                      // prevent Enter from submitting the parent form
                      if ((e as any).key === 'Enter') e.preventDefault();
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      try {
                        const resp = await fetch((API_BASE_URL ?? '') + '/invoice/logo', {
                          method: 'POST',
                          body: fd,
                        });
                        if (!resp.ok) throw new Error('Upload failed');
                        // refetch studio settings and update preview without full reload
                        if (refetchStudio) await refetchStudio();
                        setLogoPreviewUrl(`${API_BASE_URL ?? ''}/invoice/logo/file?ts=${Date.now()}`);
                      } catch (err) {
                        console.error('Logo upload failed', err);
                        alert('Logo upload failed');
                      }
                    }}
                  />
                  {logoPreviewUrl ? (
                    // add timestamp to bust cache after upload
                    <img src={logoPreviewUrl} alt="logo" className="h-12 w-auto rounded" />
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3">
                <Button type="submit" disabled={updateStudio.isPending}>Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>Defaults and templates used when creating invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitInvoice} className="grid gap-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Invoice Prefix</label>
                  <Input className="mt-1" value={invoiceForm.invoicePrefix} onChange={(e) => setInvoiceForm((s) => ({ ...s, invoicePrefix: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Starting Number</label>
                  <Input type="number" className="mt-1" value={String(invoiceForm.invoiceStartingNumber)} onChange={(e) => setInvoiceForm((s) => ({ ...s, invoiceStartingNumber: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Default Tax %</label>
                  <Input type="number" className="mt-1" value={String(invoiceForm.defaultTaxPercentage)} onChange={(e) => setInvoiceForm((s) => ({ ...s, defaultTaxPercentage: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Terms & Conditions</label>
                <Textarea className="mt-1" value={invoiceForm.invoiceTerms} onChange={(e) => setInvoiceForm((s) => ({ ...s, invoiceTerms: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Invoice Footer</label>
                <Textarea className="mt-1" value={invoiceForm.invoiceFooter} onChange={(e) => setInvoiceForm((s) => ({ ...s, invoiceFooter: e.target.value }))} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateInvoice.isPending}>Save Invoice Settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage account profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); await updateAccount.mutateAsync({ name: accountForm.name, mobile: accountForm.mobile, email: accountForm.email }); window.location.reload(); }}>
              <div>
                <label className="text-xs font-semibold text-slate-600">Name</label>
                <Input className="mt-1" value={accountForm.name} onChange={(e) => setAccountForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Mobile</label>
                <Input className="mt-1" value={accountForm.mobile} onChange={(e) => setAccountForm((s) => ({ ...s, mobile: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email</label>
                <Input className="mt-1" value={accountForm.email} onChange={(e) => setAccountForm((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={updateAccount.isPending}>Save Account</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); await changePassword.mutateAsync({ currentPassword: fd.get('currentPassword'), newPassword: fd.get('newPassword'), confirmPassword: fd.get('confirmPassword') }); alert('Password changed'); }} className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Current Password</label>
                <Input name="currentPassword" type="password" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">New Password</label>
                <Input name="newPassword" type="password" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Confirm New Password</label>
                <Input name="confirmPassword" type="password" className="mt-1" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>Change Password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
