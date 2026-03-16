import type { Metadata } from "next";
import { isInternalReviewAuthenticated } from "@/lib/internal-review-auth";
import { getOwnerSignupQueue } from "@/lib/owner-verification";
import {
  loginInternalReview,
  logoutInternalReview,
  updateOwnerApproval,
} from "@/app/internal/owner-signups/actions";

export const metadata: Metadata = {
  title: "Owner signup review",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function OwnerSignupsReviewPage() {
  const isAuthenticated = await isInternalReviewAuthenticated();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <form action={loginInternalReview} className="w-full space-y-5 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Internal Review
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Owner signup queue</h1>
            <p className="text-sm text-slate-600">
              Enter the internal review token to approve or reject public owner signups.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium">
              Internal token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              required
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white"
          >
            Unlock review queue
          </button>
        </form>
      </div>
    );
  }

  const signups = await getOwnerSignupQueue();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Internal Review
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Owner signup queue
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review verified owner requests before granting access to the app.
            </p>
          </div>

          <form action={logoutInternalReview}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            >
              Lock review page
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-4 font-semibold">Owner</th>
                <th className="px-5 py-4 font-semibold">Agency</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 font-semibold">Vérification</th>
                <th className="px-5 py-4 font-semibold">Approval</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signups.map((signup) => (
                <tr key={signup.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{signup.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{signup.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{signup.agency.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {signup.createdAt.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {signup.emailVerifiedAt ? "Verified" : "Pending"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{signup.approvalStatus}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-3">
                      <form action={updateOwnerApproval}>
                        <input type="hidden" name="userId" value={signup.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={updateOwnerApproval}>
                        <input type="hidden" name="userId" value={signup.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
