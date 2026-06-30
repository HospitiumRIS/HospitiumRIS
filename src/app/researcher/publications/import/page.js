'use client';

import ImportPublications from '../../../../components/Publications/ImportPublications';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ImportPublicationsPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleImport = async (importData) => {
        try {
            console.log('PAGE: Import data received:', importData);
            console.log('PAGE: Publications to import:', importData.publications?.length || 0);
            
            const requestBody = {
                publications: importData.publications || [],
                method: importData.method || 'unknown',
                userId: importData.userId || null,
                importedAt: new Date().toISOString()
            };

            console.log('Sending to API:', requestBody);

            const response = await fetch('/api/publications/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || t('import_tabs.failed_import_publications'));
            }

            console.log('Publications imported successfully:', data);
            
            if (data.success) {
                let message = t('import_tabs.import_success_page', { imported: data.imported, total: data.total });
                
                if (data.warnings && data.warnings.length > 0) {
                    message += `\n\n${t('import_tabs.import_warnings_page', { warnings: data.warnings.join('\n') })}`;
                }
                
                alert(message);
            } else {
                throw new Error(data.message || t('import_tabs.import_failed', { message: '' }));
            }
            
            return data;
            
        } catch (error) {
            console.error('Error importing publications:', error);
            alert(t('import_tabs.import_page_failed', { message: error.message }));
            throw error;
        }
    };

    return <ImportPublications onImport={handleImport} />;
}
