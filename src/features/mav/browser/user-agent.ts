/** Keep the installed Chromium version; remove Android WebView compatibility tokens.
 * MÁV's login page otherwise replaces itself with an external-Chrome intent.
 */
export function mavAndroidUserAgent(value: string): string {
  return value.replace(/;\s*wv\b/gi, '').replace(/\sVersion\/\d+(?:\.\d+)*/g, '');
}
