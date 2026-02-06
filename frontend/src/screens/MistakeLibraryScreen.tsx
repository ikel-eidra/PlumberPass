import "../styles/mistake-library.css";

type MistakeLibraryScreenProps = {
  onBack: () => void;
};

type MistakeItem = {
  title: string;
  tag: string;
  date: string;
  detail: string;
  image: string;
  resolved?: boolean;
};

const mistakes: MistakeItem[] = [
  {
    title: "Venting Systems: Trap Arms",
    tag: "Needs Review",
    date: "Oct 12",
    detail: "Max distance exceeded (IPC 909.1)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBh4a7TgTOoROEl2DJcP1vdWBLuBerKFE5S1zrHm6RAKzM0NIWf478PFtoeB2v09kb75vVErVTkEw58FUQBS9s7oJ6wGKJBa9R3sBvmIITX6yBl6U9LzQklZ2opBsWbaVAh4n8TQzFYTl3Ryi7-32i_7DsQWZYGNjk2eh6oVY3R_eb-UtQ2ZA305637uQaZTxIw7DPBQLMs9zqAIdLCWU8iegK15ZdsKUR4nP9xxHUDaZZCjoMt4Ud_LSXixyefFohCypyvPQ2OmJWb"
  },
  {
    title: "Isometric Analysis",
    tag: "Needs Review",
    date: "Oct 10",
    detail: "Incorrect fixture order calculation",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyZ5K1Rw2qVTCQeaNNyLXvzjXjyuJv8hfSfPiRpcSDs3AkzoVpQ_ggEH6Bst5JzUmBfeY8-NSjTxa_sTr3hmIQsvP4C4_vJIgEt6ACtUWVEtuJxl8SIcdqZd1vsj5r7kksR1FfIm7-qU-WbX3NEuII16zTkOtprJcqbTvUdmDcteFcKROwR5iMLqgiDnZ4_ZsFcbPYgO-rTgqs0HhGgRqTc9wUoFWVL6tAZaAhXWHUI9VGcyzFYKzp8z5W24resuOf9ySTs6GxVMRF"
  },
  {
    title: "Water Heater Clearances",
    tag: "Needs Review",
    date: "Oct 08",
    detail: "Gas shutoff location (IPC 502.3)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHfphFS7vIJkZqeKNEAYB1W87hAF9EZvTGQfi4-0i-0MkTqIhRnZrqd8pePBvw0AzGT1-Ch5YKuFsOAl4axej6Hul7HO2gBsNCi97_8ZSxDgHmZR63cDAuIxDn2fx0MiqM9LwdsDFl5MQx4fTPWfUQ55vSos9QzfkZpUTkzomMbzgjF7JKz-eC27e37Qj8IulD104LhGGmchacCplLa-QbSDwO515H7bWB_Kywgj2WyxL3hB5zSena5L5wqIkBz-p90P_Et1NRoHf6"
  },
  {
    title: "Storm Drainage sizing",
    tag: "Reviewed",
    date: "Sep 28",
    detail: "Mastered",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxQ3TovhdFs-INUe8e3IiiwDf9IR1m8GZZRAkuF-_h3vbGAR2dGMGKibNZQ1rJq1yVYEp4Vvpy0s8Bh9q5gOaxsD9s7XUHFQgIWpnUcDRgQv0KWAhUEdQcP68j7V0ejHbSmkZUoDydHYdThdbAm9a8yyGat9mhB6pWDmYFSaVCsJlwTDxQtoT3bj5DB4slE5SeMQbZrylPnVW_zxmxWAY3vAB7lQp-5xsqyJtUVc_1praGpV3SBU5sWUpdahLnUqtZzf2-yeY9cgIc",
    resolved: true
  }
];

export default function MistakeLibraryScreen({ onBack }: MistakeLibraryScreenProps) {
  return (
    <div className="mistake-library">
      <header className="mistake-library__topbar">
        <button type="button" className="mistake-library__icon" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2>Mistake Library</h2>
        <button type="button" className="mistake-library__icon">
          <span className="material-symbols-outlined">mic</span>
        </button>
      </header>

      <section className="mistake-library__intro">
        <h1>Field Notes Index</h1>
        <p>
          12 topics require attention. Your personal guide to strengthening
          technical weaknesses.
        </p>
      </section>

      <section className="mistake-library__search">
        <div className="mistake-library__search-row">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search topics or say 'Review mistakes'" />
        </div>
      </section>

      <section className="mistake-library__filters">
        <button className="is-active">All</button>
        <button>Sort by Date</button>
        <button>Code Sections</button>
        <button>Hydraulics</button>
      </section>

      <div className="mistake-library__divider" />

      <section className="mistake-library__list">
        {mistakes.map((mistake) => (
          <article
            key={`${mistake.title}-${mistake.date}`}
            className={`mistake-card${mistake.resolved ? " is-resolved" : ""}`}
          >
            <div className="mistake-card__image">
              <img src={mistake.image} alt={mistake.title} loading="lazy" />
              <span className="mistake-card__overlay" />
            </div>
            <div className="mistake-card__body">
              <div className="mistake-card__header">
                <span className="mistake-card__tag">{mistake.tag}</span>
                <span className="mistake-card__date">{mistake.date}</span>
              </div>
              <h3>{mistake.title}</h3>
              <div className="mistake-card__detail">
                <span className="material-symbols-outlined">
                  {mistake.resolved ? "check_circle" : "menu_book"}
                </span>
                <p>{mistake.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="mistake-library__footer">
        <button type="button">
          Study Mistakes Now
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
}
