"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { Analytics } from "@vercel/analytics/next";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-screen bg-[var(--background)] p-4 md:p-8 lg:p-12">
        <div className="pb-10 flex justify-between items-center">
          <Link
            href="/"
            className="text-[var(--foreground)] text-sm font-semibold"
          >
            {t("termsOfService.backToLogin")}
          </Link>
          <LanguageSwitcher />
        </div>{" "}
        <div className="max-w-4xl mx-auto prose prose-invert">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
            {t("termsOfService.title")}
          </h1>
          <p className="text-lg text-[var(--foreground)] mb-4">
            {t("termsOfService.lastUpdated")}
          </p>

          <div className="my-8 text-[var(--foreground)]">
            <h2 className="text-2xl font-semibold mb-4">
              {t("termsOfService.sections.acceptance.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.acceptance.content.welcome")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.acceptance.content.agreement")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.acceptance.content.application")}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.serviceDescription.title")}
            </h2>
            <p className="mb-4">
              {t(
                "termsOfService.sections.serviceDescription.content.description",
              )}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t(
                "termsOfService.sections.serviceDescription.content.features",
                { returnObjects: true },
              ).map((feature: string, index: number) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.eligibility.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.eligibility.content.description")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.eligibility.content.requirements", {
                returnObjects: true,
              }).map((requirement: string, index: number) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
            <p className="mb-4">
              {t("termsOfService.sections.eligibility.content.responsibility")}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.acceptableUse.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.acceptableUse.content.description")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.acceptableUse.content.restrictions", {
                returnObjects: true,
              })
                .slice(0, 2)
                .map((restriction: string, index: number) => (
                  <li key={index}>{restriction}</li>
                ))}
              <li>
                {
                  t(
                    "termsOfService.sections.acceptableUse.content.restrictions",
                    { returnObjects: true },
                  )[2]
                }
              </li>
              <ul className="list-disc pl-6 ml-4 mb-2">
                {t(
                  "termsOfService.sections.acceptableUse.content.contentRestrictions",
                  { returnObjects: true },
                ).map((restriction: string, index: number) => (
                  <li key={index}>{restriction}</li>
                ))}
              </ul>
              {t("termsOfService.sections.acceptableUse.content.restrictions", {
                returnObjects: true,
              })
                .slice(3)
                .map((restriction: string, index: number) => (
                  <li key={index + 3}>{restriction}</li>
                ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.userContent.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.userContent.content.description")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.userContent.content.license")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.userContent.content.representations")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.userContent.content.warranties", {
                returnObjects: true,
              }).map((warranty: string, index: number) => (
                <li key={index}>{warranty}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.intellectualProperty.title")}
            </h2>
            <p className="mb-4">
              {t(
                "termsOfService.sections.intellectualProperty.content.ownership",
              )}
            </p>
            <p className="mb-4">
              {t(
                "termsOfService.sections.intellectualProperty.content.protection",
              )}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.subscriptions.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.subscriptions.content.description")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.subscriptions.content.terms")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.subscriptions.content.conditions", {
                returnObjects: true,
              }).map((condition: string, index: number) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.cancellation.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.cancellation.content.cancellation")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.cancellation.content.refunds")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.cancellation.content.conditions", {
                returnObjects: true,
              }).map((condition: string, index: number) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.termination.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.termination.content.suspension")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.termination.content.userTermination")}
            </p>
            <p className="mb-4">
              {t(
                "termsOfService.sections.termination.content.afterTermination",
              )}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.disclaimers.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.disclaimers.content.asIs")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.disclaimers.content.noGuarantee")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.disclaimers.content.conditions", {
                returnObjects: true,
              }).map((condition: string, index: number) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.limitation.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.limitation.content.limitation")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.limitation.content.scenarios", {
                returnObjects: true,
              }).map((scenario: string, index: number) => (
                <li key={index}>{scenario}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.indemnification.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.indemnification.content.agreement")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.indemnification.content.scenarios", {
                returnObjects: true,
              }).map((scenario: string, index: number) => (
                <li key={index}>{scenario}</li>
              ))}
            </ul>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.governingLaw.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.governingLaw.content.law")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.governingLaw.content.enforcement")}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.disputes.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.disputes.content.arbitration")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.disputes.content.informal")}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.changes.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.changes.content.right")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.changes.content.determination")}
            </p>
            <p className="mb-4">
              {t("termsOfService.sections.changes.content.continuedUse")}
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.general.title")}
            </h2>
            <p className="mb-4">
              <strong>Divisibilidade:</strong>{" "}
              {
                t("termsOfService.sections.general.content.severability").split(
                  ": ",
                )[1]
              }
            </p>
            <p className="mb-4">
              <strong>Renúncia:</strong>{" "}
              {
                t("termsOfService.sections.general.content.waiver").split(
                  ": ",
                )[1]
              }
            </p>
            <p className="mb-4">
              <strong>Acordo Integral:</strong>{" "}
              {
                t(
                  "termsOfService.sections.general.content.entireAgreement",
                ).split(": ")[1]
              }
            </p>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              {t("termsOfService.sections.contact.title")}
            </h2>
            <p className="mb-4">
              {t("termsOfService.sections.contact.content.description")}
            </p>
            <ul className="list-disc pl-6 mb-4">
              {t("termsOfService.sections.contact.content.methods", {
                returnObjects: true,
              }).map((method: string, index: number) => (
                <li key={index}>{method}</li>
              ))}
            </ul>
            <p className="mb-4">
              {t("termsOfService.sections.contact.content.response")}
            </p>{" "}
            <div className="mt-8 p-4 bg-[var(--container)] rounded-lg">
              <p className="text-sm">
                <strong>{t("termsOfService.sections.important.title")}:</strong>{" "}
                {t("termsOfService.sections.important.content")}
                <Link href="/privacy" className="text-blue-500 underline ml-1">
                  {t("privacyPolicy.title")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Analytics />
    </>
  );
}
