'use client';

import Image from 'next/image';
import styles from './Header.module.css';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Image
            src="/logo-white-font.svg"
            alt="Rankeffect Logo"
            width={150}
            height={35}
            priority
          />
        </div>
        
        <nav className={styles.nav}>
          <h1 className={styles.title}>Media Gallery</h1>
        </nav>

        <a 
          href="https://rankeffect.sharepoint.com/sites/Teamrankeffect/Freigegebene%20Dokumente/Forms/AllItems.aspx?id=%2Fsites%2FTeamrankeffect%2FFreigegebene%20Dokumente%2FAllgemein%2FAgenturbilder%2FWeihnachtsfeier%202025"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sharepointLink}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>SharePoint</span>
        </a>
        
        <button onClick={logout} className={styles.logoutButton}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
