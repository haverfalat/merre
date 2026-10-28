import { initializeAccounts } from '~/lib/tickets/accounts.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import type { useWallet } from '../hooks/useWallet.native';
import { WalletError } from './WalletScreen';

export function WalletAccountErrors({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  return (
    <>
      {wallet.error && (
        <WalletError error={new TicketWalletError('identity')}
          retry={() => void initializeAccounts().catch(() => {})} />
      )}
      {wallet.failures.map((failure) => (
        <WalletError key={failure.account.id} accountLabel={failure.account.label}
          error={failure.error} retry={() => void wallet.refetch()} />
      ))}
    </>
  );
}
