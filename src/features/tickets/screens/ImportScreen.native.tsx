import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { PartialAccountImportError } from '~/lib/tickets/errors';
import { importAccounts } from '~/lib/tickets/accounts.native';
import { WalletContent, WalletError, WalletInput, WalletScreen } from '../components/WalletScreen';

export default function ImportScreen() {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const locked = useRef(false);
  const [text, setText] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const pick = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = new File(result.assets[0].uri);
      try {
        if (file.size > 750_000) throw new Error();
        setText(await file.text());
      } finally {
        if (file.exists) file.delete();
      }
    } catch {
      setError(new Error());
    }
  };
  const submit = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await importAccounts(text, applicationId.trim() || undefined);
      setText('');
      setApplicationId('');
      cache.removeQueries({ queryKey: ['ticket-wallet'] });
      router.dismissTo('/tickets');
    } catch (error) {
      if (error instanceof PartialAccountImportError) {
        setText(error.remainingJson);
        cache.removeQueries({ queryKey: ['ticket-wallet'] });
      }
      setError(error);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <WalletScreen title={t('tickets_import')}>
      <WalletContent>
        <Text style={{ fontSize: 12 }}>{t('tickets_import_note')}</Text>
        <Button label={t('tickets_import_file')} onPress={() => void pick()} disabled={busy} />
        <WalletInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder={t('tickets_import_placeholder')}
          accessibilityLabel={t('tickets_import_placeholder')}
          editable={!busy}
          style={{ height: 180, textAlignVertical: 'top' }}
          maxLength={750_000}
        />
        <WalletInput
          value={applicationId}
          onChangeText={setApplicationId}
          placeholder={t('tickets_application_id')}
          accessibilityLabel={t('tickets_application_id')}
          editable={!busy}
          maxLength={36}
        />
        {error ? <WalletError error={error} /> : null}
        <Button
          label={t('tickets_import')}
          variant="primary"
          loading={busy}
          disabled={busy || !text.trim()}
          onPress={() => void submit()}
        />
      </WalletContent>
    </WalletScreen>
  );
}
