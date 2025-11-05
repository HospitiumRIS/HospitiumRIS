'use client';
import SubmitPublication from '../../../../components/Publications/SubmitPublication.jsx';
import { useRouter } from 'next/navigation';

export default function SubmitPublicationPage() {
    const router = useRouter();
    return <SubmitPublication />;
}
