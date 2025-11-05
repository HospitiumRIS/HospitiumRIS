'use client';

import ImportPublications from '../../../../components/Publications/ImportPublications';
import { useRouter } from 'next/navigation';

export default function ImportPublicationsPage() {
    const router = useRouter();

    const handleImport = async (importData) => {
        try {
            console.log('PAGE: Import data received:', importData);
            console.log('PAGE: Publications to import:', importData.publications?.length || 0);
            
            // Structure the data correctly for the API
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
                throw new Error(data.error || 'Failed to import publications');
            }

            console.log('Publications imported successfully:', data);
            
            // Show success message to user
            if (data.success) {
                let message = `Successfully imported ${data.imported} of ${data.total} publications!`;
                
                if (data.warnings && data.warnings.length > 0) {
                    message += `\n\nWarnings:\n${data.warnings.join('\n')}`;
                }
                
                alert(message);
                
                // Optionally redirect to publications page
                // router.push('/researcher/publications');
            } else {
                throw new Error(data.message || 'Import failed');
            }
            
            return data;
            
        } catch (error) {
            console.error('Error importing publications:', error);
            alert(`Import failed: ${error.message}`);
            throw error;
        }
    };

    return <ImportPublications onImport={handleImport} />;
}
