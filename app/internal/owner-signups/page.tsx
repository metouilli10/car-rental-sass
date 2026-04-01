import type { Metadata } from "next";
import { isInternalReviewAuthenticated } from "@/lib/internal-review-auth";
import {
  formatDateInputValue,
  getAgencySubscriptionState,
} from "@/lib/internal-agency-admin";
import { getOwnerSignupQueue } from "@/lib/owner-verification";
import {
  deleteAgency,
  loginInternalReview,
  logoutInternalReview,
  updateAgencySubscription,
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

type OwnerSignup = Awaited<ReturnType<typeof getOwnerSignupQueue>>[number];

function getSubscriptionToneClasses(tone: "unpaid" | "active" | "expired") {
  switch (tone) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "expired":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getApprovalToneClasses(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function ApprovalBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getApprovalToneClasses(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

function ApprovalActions({
  signup,
  stacked = false,
}: {
  signup: OwnerSignup;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>
      <form action={updateOwnerApproval}>
        <input type="hidden" name="userId" value={signup.id} />
        <input type="hidden" name="status" value="APPROVED" />
        <button
          type="submit"
          className={`inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white ${
            stacked ? "w-full" : ""
          }`}
        >
          Approve
        </button>
      </form>
      <form action={updateOwnerApproval}>
        <input type="hidden" name="userId" value={signup.id} />
        <input type="hidden" name="status" value="REJECTED" />
        <button
          type="submit"
          className={`inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 ${
            stacked ? "w-full" : ""
          }`}
        >
          Reject
        </button>
      </form>
    </div>
  );
}

function AgencySubscriptionEditor({ signup }: { signup: OwnerSignup }) {
  const subscription = getAgencySubscriptionState({
    subscriptionPaid: signup.agency.subscriptionPaid,
    subscriptionEndsAt: signup.agency.subscriptionEndsAt,
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-slate-900">{signup.agency.name}</p>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSubscriptionToneClasses(
            subscription.tone,
          )}`}
        >
          {subscription.label}
        </span>
      </div>

      <p className="text-xs text-slate-500">{subscription.description}</p>

      <form
        action={updateAgencySubscription}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <input type="hidden" name="agencyId" value={signup.agency.id} />
        <input type="hidden" name="subscriptionPaid" value="false" />

        <label className="flex min-w-fit items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="subscriptionPaid"
            value="true"
            defaultChecked={signup.agency.subscriptionPaid}
            className="h-4 w-4 rounded border-slate-300"
          />
          Paid
        </label>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:min-w-[220px] sm:flex-1 sm:flex-row sm:items-center">
          <label
            htmlFor={`subscriptionEndsAt-${signup.agency.id}`}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            End
          </label>
          <input
            id={`subscriptionEndsAt-${signup.agency.id}`}
            name="subscriptionEndsAt"
            type="date"
            defaultValue={formatDateInputValue(signup.agency.subscriptionEndsAt)}
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-900"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 sm:w-auto"
        >
          Save
        </button>
      </form>

      <details className="group rounded-2xl border border-red-200 bg-red-50/70">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 marker:hidden">
          Danger zone
        </summary>
        <form action={deleteAgency} className="space-y-3 border-t border-red-200 px-3 py-3">
          <input type="hidden" name="agencyId" value={signup.agency.id} />
          <input type="hidden" name="agencyName" value={signup.agency.name} />

          <p className="text-xs text-red-700">
            Type <span className="font-semibold">{signup.agency.name}</span> to
            confirm permanent deletion.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              name="confirmName"
              type="text"
              placeholder={signup.agency.name}
              className="h-10 w-full min-w-0 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-red-500"
            />

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white sm:w-auto"
            >
              Delete agency
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

export default async function OwnerSignupsReviewPage() {
  const isAuthenticated = await isInternalReviewAuthenticated();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 sm:px-6">
        <form
          action={loginInternalReview}
          className="w-full space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
        >
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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Internal Review
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Owner signup queue
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review verified owner requests before granting access to the app.
            </p>
          </div>

          <form action={logoutInternalReview} className="w-full sm:w-auto">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 sm:w-auto"
            >
              Lock review page
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          {signups.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
              No owner signups are waiting for review.
            </div>
          ) : (
            <>
              <div className="space-y-4 p-4 md:hidden">
                {signups.map((signup) => (
                  <article
                    key={signup.id}
                    className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{signup.name}</p>
                          <p className="mt-1 break-all text-sm text-slate-500">
                            {signup.email}
                          </p>
                        </div>
                        <ApprovalBadge status={signup.approvalStatus} />
                      </div>

                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Created
                          </p>
                          <p className="mt-1">{signup.createdAt.toLocaleString("fr-FR")}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Verification
                          </p>
                          <p className="mt-1">
                            {signup.emailVerifiedAt ? "Verified" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Agency
                      </p>
                      <AgencySubscriptionEditor signup={signup} />
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Actions
                      </p>
                      <ApprovalActions signup={signup} stacked />
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
                        <td className="px-5 py-4">
                          <AgencySubscriptionEditor signup={signup} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {signup.createdAt.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {signup.emailVerifiedAt ? "Verified" : "Pending"}
                        </td>
                        <td className="px-5 py-4">
                          <ApprovalBadge status={signup.approvalStatus} />
                        </td>
                        <td className="px-5 py-4">
                          <ApprovalActions signup={signup} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
