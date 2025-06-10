import React, { useState, useEffect } from 'react';

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return; // App is already installed, no need to show the button
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Optionally, send analytics event that PWA is ready to install on desktop
      console.info("PWA is ready to install");
    };

    const handleAppInstalled = () => {
      console.info("App Installed!");
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);


    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);


  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      // We've used the prompt, and can't use it again, clear it
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true); // Optionally, hide the button after successful install
      }
    }
  };

  if (isInstalled) {
    return null;  // Hide the install button if already installed or installation was accepted
  }


  return (
    deferredPrompt && ( // Only render if there's a deferredPrompt
      <button onClick={handleInstallClick}>
        Install App
      </button>
    )
  );
}

export default InstallButton;