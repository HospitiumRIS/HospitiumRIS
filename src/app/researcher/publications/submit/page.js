'use client';
import SubmitPublication from '../../../../components/Publications/SubmitPublication.jsx';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function SubmitPublicationPage() {
    const { t } = useTranslation();
    const router = useRouter();
    return <SubmitPublication />;
}
