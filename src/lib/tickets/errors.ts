export class TicketWalletError extends Error {
  constructor(
    readonly code:
      'auth' | 'identity' | 'import' | 'expired-session' | 'unavailable' | 'protocol' | 'network',
  ) {
    super(`Ticket wallet: ${code}`);
    this.name = 'TicketWalletError';
  }
}

export class PartialAccountImportError extends TicketWalletError {
  constructor(
    readonly imported: number,
    readonly remainingJson: string,
  ) {
    super('import');
    this.name = 'PartialAccountImportError';
  }
}
