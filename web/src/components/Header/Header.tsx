import styles from "./Header.module.css";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSignIn: () => void;
}

export function Header({ user, onLogout, onSignIn }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.logo}>Acromaps</h1>
        <nav className={styles.nav}>
          <a href="#map">Map</a>
          <a href="#events">Events</a>
          <a href="#about">About</a>
          {user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user.name}</span>
              <button className="btn btn-secondary" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onSignIn}>
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
