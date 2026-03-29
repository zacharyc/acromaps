import type { ReactNode } from "react";
import { Header } from "../Header/Header";
import { AuthModal } from "../AuthModal/AuthModal";
import { CreateEventModal } from "../CreateEventModal/CreateEventModal";
import { useApp } from "../../contexts/AppContext";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const {
    user,
    handleLogout,
    setShowAuthModal,
    showAuthModal,
    showCreateEventModal,
    setShowCreateEventModal,
    setUser,
    fetchEvents,
    mapboxToken,
    handleCreateEvent,
  } = useApp();

  return (
    <div className={styles.layout}>
      <Header
        user={user}
        onLogout={handleLogout}
        onSignIn={() => setShowAuthModal(true)}
        onCreateEvent={handleCreateEvent}
      />

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} Acromaps. Made with &#x2764;&#xfe0f;
          for the acroyoga community.
        </p>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => setUser(user)}
      />

      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={fetchEvents}
        mapboxToken={mapboxToken}
      />
    </div>
  );
}
