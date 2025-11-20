'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/services/api';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { modernToast } from '@/utils/toast';
import clsx from 'clsx';
import Image from 'next/image';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { tokenStore } from '@/services/token';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';

const ProfileSchema = Yup.object({
  username: Yup.string().min(2, 'Too short').max(32, 'Too long').optional(),
  avatar: Yup.string().url('Enter a valid URL').optional(),
});

const quotes = [
  '🌸 Be still, the universe flows through you.',
  '✨ Breathe. You are exactly where you need to be.',
  '🌿 In stillness, clarity emerges.',
  '🌙 Trust the timing of your life.',
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.me();
        setUser(res.data?.data);
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700" />
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" animate={{ y: [0, 20, 0], x: [0, 10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" animate={{ y: [0, -20, 0], x: [0, -10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-6">
        <div className="mt-4">
          <BackButton className="bg-white/10 hover:bg-white/20 text-white border border-white/20" />
        </div>
        <motion.div className="mx-auto mt-8 rounded-2xl bg-white/10 p-6 text-center text-indigo-100 ring-1 ring-white/20 backdrop-blur-md" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-lg">{quote}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <motion.div className="rounded-2xl bg-white/10 p-8 ring-1 ring-white/20 backdrop-blur-md" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {loading ? (
              <p className="text-indigo-100">Loading profile...</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-full ring-2 ring-purple-300">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt="avatar" width={112} height={112} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-4xl">🕉️</div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-0 animate-pulse rounded-full ring-8 ring-purple-400/10" />
                </div>
                <div className="text-center text-indigo-100">
                  <h2 className="text-xl font-semibold">{user?.username || 'Nameless Soul'}</h2>
                  <p className="text-sm text-indigo-200">{user?.email}</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div className="rounded-2xl bg-white/10 p-8 ring-1 ring-white/20 backdrop-blur-md" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-lg font-semibold text-transparent">Edit profile</h3>
              <button
                onClick={async () => {
                  try {
                    await authAPI.logout();
                    tokenStore.clear();
                    modernToast.auth.logoutSuccess();
                    router.push('/auth/login');
                  } catch (err: any) {
                    modernToast.auth.logoutError();
                  }
                }}
                className={clsx('rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow hover:from-purple-400 hover:to-indigo-400')}
              >
                Logout
              </button>
            </div>
            <Formik
              enableReinitialize
              initialValues={{ username: user?.username || '', avatar: user?.avatar || '' }}
              validationSchema={ProfileSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                try {
                  await authAPI.updateProfile({ username: values.username || undefined, avatar: values.avatar || undefined });
                  modernToast.profile.updateSuccess();
                  const res = await authAPI.me();
                  setUser(res.data?.data);
                } catch (err: any) {
                  const msg = err?.response?.data?.error || err?.response?.data?.message || 'Update failed';
                  modernToast.profile.updateError(String(msg));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-indigo-100">Username</label>
                    <Field name="username" type="text" className={clsx('w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-sm transition focus:border-purple-300 focus:bg-white/20')} placeholder="your new name" />
                    <ErrorMessage name="username" component="div" className="mt-1 text-sm text-rose-200" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-indigo-100">Avatar URL</label>
                    <Field name="avatar" type="url" className={clsx('w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-sm transition focus:border-purple-300 focus:bg-white/20')} placeholder="https://..." />
                    <ErrorMessage name="avatar" component="div" className="mt-1 text-sm text-rose-200" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className={clsx('w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-60')}>Save changes</button>
                </Form>
              )}
            </Formik>
            <div className="mt-8">
              <h3 className="mb-3 bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-lg font-semibold text-transparent">Change password</h3>
              <Formik
                initialValues={{ old_password: '', new_password: '', confirm_password: '' }}
                validationSchema={Yup.object({
                  old_password: Yup.string().required('Required'),
                  new_password: Yup.string()
                    .min(8, 'At least 8 characters')
                    .matches(/[a-z]/, 'Add a lowercase letter')
                    .matches(/[A-Z]/, 'Add an uppercase letter')
                    .matches(/[0-9]/, 'Add a number')
                    .matches(/[^A-Za-z0-9]/, 'Add a special character')
                    .required('Required')
                    .test('different', 'New password must differ from old', function (value) {
                      return value !== this.parent.old_password;
                    }),
                  confirm_password: Yup.string()
                    .oneOf([Yup.ref('new_password')], 'Passwords must match')
                    .required('Required'),
                })}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                  setSubmitting(true);
                  try {
                    await authAPI.changePassword({ old_password: values.old_password, new_password: values.new_password });
                    modernToast.profile.passwordChanged();
                    await authAPI.logout();
                    tokenStore.clear();
                    router.push('/auth/login');
                  } catch (err: any) {
                    const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to change password';
                    modernToast.profile.passwordError(String(msg));
                  } finally {
                    setSubmitting(false);
                    resetForm();
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-100">Old password</label>
                      <Field name="old_password" type="password" className={clsx('w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-sm transition focus:border-purple-300 focus:bg-white/20')} placeholder="••••••••" />
                      <ErrorMessage name="old_password" component="div" className="mt-1 text-sm text-rose-200" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-100">New password</label>
                      <Field name="new_password" type="password" className={clsx('w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-sm transition focus:border-purple-300 focus:bg-white/20')} placeholder="StrongPass#123" />
                      <ErrorMessage name="new_password" component="div" className="mt-1 text-sm text-rose-200" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-100">Confirm password</label>
                      <Field name="confirm_password" type="password" className={clsx('w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/60 outline-none backdrop-blur-sm transition focus:border-purple-300 focus:bg-white/20')} placeholder="StrongPass#123" />
                      <ErrorMessage name="confirm_password" component="div" className="mt-1 text-sm text-rose-200" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className={clsx('w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-60')}>Update password</button>
                  </Form>
                )}
              </Formik>
            </div>
          </motion.div>
        </div>
      </div>
      <Toaster position="top-right" />
      </div>
    </ProtectedRoute>
  );
}

function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  return (
    <div className="mt-10 rounded-2xl border border-rose-300/30 bg-rose-500/5 p-4 ring-1 ring-rose-300/20">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-rose-200">Danger Zone</h4>
        <button onClick={() => setOpen(true)} className={clsx('rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-3 py-2 text-sm font-semibold text-white shadow hover:from-rose-500 hover:to-red-500')}>Delete Account</button>
      </div>
      {open && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 rounded-xl border border-rose-300/30 bg-rose-900/30 p-4 ring-1 ring-rose-300/20">
          <p className="mb-2 text-sm text-rose-100">Are you sure you want to delete your account?</p>
          <p className="mb-3 text-xs text-rose-200">This action is irreversible. Type <span className="font-semibold">DELETE</span> to confirm.</p>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mb-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none" placeholder="DELETE" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Cancel</button>
            <button
              onClick={async () => {
                if (confirmText !== 'DELETE') { modernToast.profile.deleteConfirmError(); return; }
                try {
                  await authAPI.deleteAccount();
                  tokenStore.clear();
                  modernToast.profile.accountDeleted();
                  router.push('/');
                } catch (err: any) {
                  const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to delete account';
                  modernToast.profile.deleteError(String(msg));
                }
              }}
              className="rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-3 py-2 text-sm font-semibold text-white shadow hover:from-rose-500 hover:to-red-500"
            >
              Delete
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
