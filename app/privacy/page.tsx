"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8 lg:p-12">
      <div className="pb-10 flex justify-between items-center">
        <Link
          href="/"
          className="text-[var(--foreground)] text-sm font-semibold"
        >
          {t('privacyPolicy.backToLogin')}
        </Link>
        <LanguageSwitcher />
      </div>
      <div className="max-w-4xl mx-auto prose prose-invert">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
          {t('privacyPolicy.title')}
        </h1>
        <p className="text-lg text-[var(--foreground)] mb-4">
          {t('privacyPolicy.lastUpdated')}
        </p>
        <p className="text-sm text-[var(--foreground)] mb-6 opacity-80">
          {t('privacyPolicy.version')}
        </p>

        <div className="my-8 text-[var(--foreground)]">
          <h2 className="text-2xl font-semibold mb-4">{t('privacyPolicy.sections.introduction.title')}</h2>
          <p className="mb-4">
            {t('privacyPolicy.sections.introduction.content.welcome')}
          </p>
          <p className="mb-4">
            {t('privacyPolicy.sections.introduction.content.compliance')}
          </p>
          <p className="mb-4">
            {t('privacyPolicy.sections.introduction.content.agreement')}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataController.title')}
          </h2>
          <p className="mb-4">
            {t('privacyPolicy.sections.dataController.content.description')}
          </p>
          <p className="mb-4">
            <strong>{t('privacyPolicy.sections.dataController.content.contactInfo')}</strong>
            <br />
            {t('privacyPolicy.sections.dataController.content.name')}
            <br />
            {t('privacyPolicy.sections.dataController.content.email')}
            <br />
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataTypes.title')}
          </h2>
          <p>{t('privacyPolicy.sections.dataTypes.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.registration').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.registration').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.profile').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.profile').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.userContent').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.userContent').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.usage').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.usage').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.technical').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.technical').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.location').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.location').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataTypes.types.cookies').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataTypes.types.cookies').split(':')[1]}
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataCollection.title')}
          </h2>
          <p>{t('privacyPolicy.sections.dataCollection.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>{t('privacyPolicy.sections.dataCollection.methods.directly')}</li>
            <li>{t('privacyPolicy.sections.dataCollection.methods.automatically')}</li>
            <li>{t('privacyPolicy.sections.dataCollection.methods.thirdParty')}</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataPurposes.title')}
          </h2>
          <p>{t('privacyPolicy.sections.dataPurposes.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.provide')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.account')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.storage')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.personalize')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.improve')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.support')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.payment')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.security')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.legal')}</li>
            <li>{t('privacyPolicy.sections.dataPurposes.purposes.sync')}</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.legalBasis.title')}
          </h2>
          <p>{t('privacyPolicy.sections.legalBasis.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>{t('privacyPolicy.sections.legalBasis.bases.consent').split(':')[0]}:</strong> {t('privacyPolicy.sections.legalBasis.bases.consent').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.legalBasis.bases.contract').split(':')[0]}:</strong> {t('privacyPolicy.sections.legalBasis.bases.contract').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.legalBasis.bases.legitimate').split(':')[0]}:</strong> {t('privacyPolicy.sections.legalBasis.bases.legitimate').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.legalBasis.bases.legal').split(':')[0]}:</strong> {t('privacyPolicy.sections.legalBasis.bases.legal').split(':')[1]}
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataRetention.title')}
          </h2>
          <p className="mb-4">
            {t('privacyPolicy.sections.dataRetention.content.principle')}
          </p>
          <p className="mb-4">
            {t('privacyPolicy.sections.dataRetention.content.factors')}
          </p>
          <p className="mb-4">
            {t('privacyPolicy.sections.dataRetention.content.anonymization')}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataSharing.title')}
          </h2>
          <p>{t('privacyPolicy.sections.dataSharing.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>{t('privacyPolicy.sections.dataSharing.categories.serviceProviders').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataSharing.categories.serviceProviders').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataSharing.categories.authorities').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataSharing.categories.authorities').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.dataSharing.categories.business').split(':')[0]}:</strong> {t('privacyPolicy.sections.dataSharing.categories.business').split(':')[1]}
            </li>
          </ul>
          <p className="mb-4">
            {t('privacyPolicy.sections.dataSharing.note')}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.internationalTransfers.title')}
          </h2>
          <p className="mb-4">
            {t('privacyPolicy.sections.internationalTransfers.content')}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.dataSecurity.title')}
          </h2>
          <p>{t('privacyPolicy.sections.dataSecurity.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>{t('privacyPolicy.sections.dataSecurity.measures.encryption')}</li>
            <li>{t('privacyPolicy.sections.dataSecurity.measures.authentication')}</li>
            <li>{t('privacyPolicy.sections.dataSecurity.measures.monitoring')}</li>
            <li>{t('privacyPolicy.sections.dataSecurity.measures.access')}</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.yourRights.title')}
          </h2>
          <p>{t('privacyPolicy.sections.yourRights.description')}</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.access').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.access').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.rectification').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.rectification').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.erasure').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.erasure').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.restriction').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.restriction').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.portability').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.portability').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.objection').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.objection').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.withdraw').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.withdraw').split(':')[1]}
            </li>
            <li>
              <strong>{t('privacyPolicy.sections.yourRights.rights.automated').split(':')[0]}:</strong> {t('privacyPolicy.sections.yourRights.rights.automated').split(':')[1]}
            </li>
          </ul>
          <p className="mb-4">
            {t('privacyPolicy.sections.yourRights.exercise')}
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            {t('privacyPolicy.sections.contact.title')}
          </h2>
          <p className="mb-4">
            {t('privacyPolicy.sections.contact.description')}
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>{t('privacyPolicy.sections.contact.contacts.main').split(':')[0]}:</strong> {t('privacyPolicy.sections.contact.contacts.main').split(':')[1]}</li>
            <li><strong>{t('privacyPolicy.sections.contact.contacts.dpo').split(':')[0]}:</strong> {t('privacyPolicy.sections.contact.contacts.dpo').split(':')[1]}</li>
            <li><strong>{t('privacyPolicy.sections.contact.contacts.support').split(':')[0]}:</strong> {t('privacyPolicy.sections.contact.contacts.support').split(':')[1]}</li>
          </ul>
          <p className="mb-4">
            {t('privacyPolicy.sections.contact.complaint')}
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>{t('privacyPolicy.sections.contact.authorities.brazil').split(':')[0]}:</strong> {t('privacyPolicy.sections.contact.authorities.brazil').split(':')[1]}</li>
            <li><strong>{t('privacyPolicy.sections.contact.authorities.eu').split(':')[0]}:</strong> {t('privacyPolicy.sections.contact.authorities.eu').split(':')[1]}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
