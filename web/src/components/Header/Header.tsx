import { Link, useLocation } from "react-router-dom";
import type { User } from "../../types";
import styles from "./Header.module.css";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSignIn: () => void;
  onCreateEvent: () => void;
}

export function Header({ user, onLogout, onSignIn, onCreateEvent }: HeaderProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link to="/" className={styles.logoLink}>
          <h1 className={styles.logo}>Acromaps</h1>
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={isActive("/") ? styles.active : undefined}>
            Map
          </Link>
          <Link to="/events" className={isActive("/events") ? styles.active : undefined}>
            Events
          </Link>
          <Link to="/about" className={isActive("/about") ? styles.active : undefined}>
            About
          </Link>
          <button
            className={`btn btn-primary ${styles.createEventBtn}`}
            onClick={onCreateEvent}
          >
            Create Event
          </button>
          {user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user.name}</span>
              <button className="btn btn-secondary" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={onSignIn}>
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
