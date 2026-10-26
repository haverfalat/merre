import { useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { Archive, Download, Plus, Trash2, Upload } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { Choice } from '~/components/ui/Choice';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts } from '~/lib/theme';
import {
  exportAccounts,
  initializeAccounts,
  removeAccount,
  renameAccount,
  useTicketAccounts,
} from '~/lib/tickets/accounts.native';
import { ticketProviders } from '~/lib/tickets/providers.native';
import type { AccountSummary } from '~/lib/tickets/types';
import {
  WalletContent,
  WalletError,
  WalletInput,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';

function AccountRow({
  account,
  busy,
  act,
  exportOne,
}: {
  account: AccountSummary;
  busy: boolean;
  act: (operation: () => Promise<void>) => void;
  exportOne: () => void;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(account.label);
  const reconnect = ticketProviders
    .find((provider) => provider.id === account.providerId)
    ?.reauthenticateRoute?.(account.id);
  return (
    <Card style={{ padding: 10, gap: 8 }}>
      <Text style={{ fontFamily: fonts.semibold }}>
        {ticketProviders.find((p) => p.id === account.providerId)?.name ?? account.providerId}
      </Text>
      <WalletInput
        value={label}
        onChangeText={setLabel}
        maxLength={100}
        accessibilityLabel={t('tickets_account_name')}
      />
      <ActionRow>
        <Button
          icon={Archive}
          label={t('tickets_inactive_tickets')}
          disabled={busy}
          onPress={() =>
            router.push({ pathname: '/tickets/history', params: { account: account.id } })
          }
        />
        <Button
          label={t('tickets_save')}
          disabled={busy || !label.trim() || label.trim() === account.label}
          onPress={() => act(() => renameAccount(account.id, label))}
        />
        {reconnect && (
          <Button
            label={t('tickets_reauthenticate')}
            disabled={busy}
            onPress={() => router.push(reconnect)}
          />
        )}
        <Button label={t('tickets_export')} icon={Upload} disabled={busy} onPress={exportOne} />
        <Button
          label={t('tickets_remove')}
          icon={Trash2}
          disabled={busy}
          onPress={() =>
            Alert.alert(t('tickets_remove_title'), t('tickets_remove_body'), [
              { text: t('tickets_cancel'), style: 'cancel' },
              {
                text: t('tickets_remove'),
                style: 'destructive',
                onPress: () => act(() => removeAccount(account.id)),
              },
            ])
          }
        />
      </ActionRow>
    </Card>
  );
}
export default function AccountsScreen() {
  const { t } = useTranslation();
  const { ready, error: storageError, accounts } = useTicketAccounts();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const cache = useQueryClient();
  const locked = useRef(false);
  useEffect(() => {
    void initializeAccounts().catch(setError);
  }, []);
  const act = (operation: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    void operation()
      .then(() => {
        cache.removeQueries({ queryKey: ['ticket-wallet'] });
      })
      .catch(setError)
      .finally(() => {
        locked.current = false;
        setBusy(false);
      });
  };
  const exportFile = (id?: string) =>
    Alert.alert(t('tickets_export_title'), t('tickets_export_note'), [
      { text: t('tickets_cancel'), style: 'cancel' },
      {
        text: t('tickets_continue'),
        onPress: () =>
          act(async () => {
            if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing unavailable');
            const file = new File(Paths.cache, 'merre-ticket-accounts.json');
            try {
              const contents = await exportAccounts(id);
              file.create({ overwrite: true });
              await file.write(contents);
              await Sharing.shareAsync(file.uri, {
                mimeType: 'application/json',
                UTI: 'public.json',
                dialogTitle: t('tickets_export'),
              });
            } finally {
              if (file.exists) file.delete();
            }
          }),
      },
    ]);
  return (
    <>
      <WalletScreen title={t('tickets_accounts')}>
        <WalletContent>
          {storageError && (
            <WalletError error={error} retry={() => void initializeAccounts().catch(setError)} />
          )}
          {!ready && !storageError && <WalletLoading />}
          {error && !storageError ? <WalletError error={error} /> : null}
          {ready && accounts.length === 0 && (
            <Text style={{ fontSize: 12 }}>{t('tickets_no_accounts')}</Text>
          )}
          {accounts.map((account) => (
            <AccountRow
              key={`${account.id}:${account.label}`}
              account={account}
              busy={busy}
              act={act}
              exportOne={() => exportFile(account.id)}
            />
          ))}
          {ready && (
            <>
              <Button
                icon={Plus}
                label={t('tickets_add_account')}
                disabled={busy}
                onPress={() => setAdding(true)}
              />
              <Button
                icon={Download}
                label={t('tickets_import')}
                disabled={busy}
                onPress={() => router.push('/tickets/import')}
              />
              {!!accounts.length && (
                <Button
                  icon={Upload}
                  label={t('tickets_export_all')}
                  disabled={busy}
                  onPress={() => exportFile()}
                />
              )}
            </>
          )}
        </WalletContent>
      </WalletScreen>
      <ModalFrame visible={adding} onClose={() => setAdding(false)}>
        <ModalHeader title={t('tickets_add_account')} onClose={() => setAdding(false)} />
        <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
          {ticketProviders.map((provider) => (
            <Choice
              key={provider.id}
              kind="radio"
              checked={false}
              label={provider.name}
              onPress={() => {
                setAdding(false);
                router.push(provider.loginRoute);
              }}
            />
          ))}
        </ScrollView>
        <ModalFooter onClose={() => setAdding(false)} />
      </ModalFrame>
    </>
  );
}
