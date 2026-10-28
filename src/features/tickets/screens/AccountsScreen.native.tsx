import { useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { ModalFrame } from '~/components/ui/ModalFrame';
import { ModalHeader } from '~/components/ui/ModalHeader';
import { ModalFooter } from '~/components/ui/ModalFooter';
import { ListRow } from '~/components/ui/ListRow';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
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
  const c = useTheme();
  const [label, setLabel] = useState(account.label);
  const [expanded, setExpanded] = useState(false);
  const reconnect = ticketProviders
    .find((provider) => provider.id === account.providerId)
    ?.reauthenticateRoute?.(account.id);
  return (
    <Card
      style={{
        paddingVertical: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderColor: c.border,
        borderRadius: 0,
      }}
    >
      <ListRow
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel={`${account.label}, ${t('account_manage')}`}
        accessibilityState={{ expanded }}
        style={{ paddingHorizontal: 0 }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 18, fontFamily: fonts.semibold }}>{account.label}</Text>
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {ticketProviders.find((p) => p.id === account.providerId)?.name ?? account.providerId}
          </Text>
        </View>
        {expanded ? (
          <ChevronDown size={18} color={c.muted} />
        ) : (
          <ChevronRight size={18} color={c.muted} />
        )}
      </ListRow>
      {expanded && (
        <>
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
              variant="ghost"
              textColor={c.danger}
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
        </>
      )}
    </Card>
  );
}
export default function AccountsScreen() {
  const { t } = useTranslation();
  const c = useTheme();
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
            <WalletError
              error={storageError}
              retry={() => void initializeAccounts().catch(setError)}
            />
          )}
          {!ready && !storageError && <WalletLoading />}
          {error && !storageError ? <WalletError error={error} /> : null}
          {ready && accounts.length === 0 && (
            <Text style={{ fontSize: 14 }}>{t('tickets_no_accounts')}</Text>
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
                variant="primary"
                icon={Plus}
                label={t('tickets_add_account')}
                disabled={busy}
                onPress={() => setAdding(true)}
              />
              <Button
                variant="ghost"
                icon={Download}
                label={t('tickets_import')}
                disabled={busy}
                onPress={() => router.push('/tickets/import')}
              />
              {!!accounts.length && (
                <Button
                  variant="ghost"
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
            <ListRow
              key={provider.id}
              accessibilityLabel={provider.name}
              onPress={() => {
                setAdding(false);
                router.push(provider.loginRoute);
              }}
            >
              <Text style={{ flex: 1, fontFamily: fonts.medium }}>{provider.name}</Text>
              <ChevronRight size={18} color={c.muted} accessible={false} />
            </ListRow>
          ))}
        </ScrollView>
        <ModalFooter onClose={() => setAdding(false)} />
      </ModalFrame>
    </>
  );
}
