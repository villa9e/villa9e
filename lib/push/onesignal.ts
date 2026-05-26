// OneSignal push notifications — web push for villa9e PWA
export async function initOneSignal() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId || typeof window === 'undefined') return;

  // Load OneSignal SDK dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    (window as any).OneSignal = (window as any).OneSignal || [];
    (window as any).OneSignal.push(() => {
      (window as any).OneSignal.init({
        appId,
        safari_web_id: '',
        notifyButton: { enable: false },
        promptOptions: {
          slidedown: {
            prompts: [{
              type: 'push',
              autoPrompt: false,
              text: {
                actionMessage: "Get notified when you earn OoWops, complete goals, and when your village needs you.",
                acceptButton: 'Allow',
                cancelButton: 'Not now',
              },
            }],
          },
        },
      });
    });
  };
}

export async function promptPushPermission() {
  if (typeof window === 'undefined' || !(window as any).OneSignal) return;
  (window as any).OneSignal.push(() => {
    (window as any).OneSignal.showSlidedownPrompt();
  });
}

export async function setOneSignalExternalId(userId: string) {
  if (typeof window === 'undefined' || !(window as any).OneSignal) return;
  (window as any).OneSignal.push(() => {
    (window as any).OneSignal.setExternalUserId(userId);
  });
}
