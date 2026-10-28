import { Redirect } from 'expo-router';

export default function MobileOnlyRedirect() {
  return <Redirect href="/" />;
}
