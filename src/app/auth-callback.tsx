// Deep-link target for OAuth / email confirmation (bharathbuild://auth-callback). The login screen
// finishes the code exchange; this route just lands the user somewhere sensible.
import { Redirect } from "expo-router";
export default function AuthCallback() {
  return <Redirect href="/home" />;
}
