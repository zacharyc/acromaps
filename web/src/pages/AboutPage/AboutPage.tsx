import { Helmet } from "react-helmet-async";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>About - Acromaps</title>
        <meta
          name="description"
          content="Learn about Acromaps, a platform for finding acroyoga events around the world."
        />
      </Helmet>

      <div className={styles.container}>
        <h1>About Acromaps</h1>

        <section className={styles.section}>
          <p>
            This incarnation of Acromaps was created to replace an older version
            built by OG members of the acroyoga community. The goal of this site
            is to allow people to find acroyoga events around the world.
          </p>

          <p>
            One of the issues with the OG Acromaps was that events got stale.
            The goal of this site is to change that. There is a little bit of
            overhead—you have to have an account to create an event—but events
            will remain current because you will be prompted to confirm the
            validity of your event on a schedule or it will be removed.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Our Mission</h2>
          <p>
            We believe that finding acroyoga events should be easy. Whether
            you're looking for a local jam, a structured class, or an
            international festival, Acromaps helps you connect with the global
            acroyoga community.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Event Types</h2>
          <div className={styles.typeList}>
            <div className={styles.typeItem}>
              <h3 className={styles.typeClass}>Classes</h3>
              <p>Learn from experienced teachers in structured classes.</p>
            </div>
            <div className={styles.typeItem}>
              <h3 className={styles.typeJam}>Jams</h3>
              <p>Practice with the community in open jam sessions.</p>
            </div>
            <div className={styles.typeItem}>
              <h3 className={styles.typeFestival}>Festivals</h3>
              <p>Multi-day gatherings celebrating acroyoga.</p>
            </div>
            <div className={styles.typeItem}>
              <h3 className={styles.typeEvent}>Events</h3>
              <p>Workshops, performances, and special events.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Get Involved</h2>
          <p>
            Have an event to share? Create an account and list your event to
            help others in the community find you. Together, we can build the
            most comprehensive directory of acroyoga events worldwide.
          </p>
        </section>
      </div>
    </div>
  );
}
