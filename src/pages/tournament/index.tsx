import styles from "./Tournament.module.css";
import { Leaderboard } from "../../components/leaderboards";
import NavbarElement from "../../components/design/navbar";
import Banner from "../../assets/img/banner-noback.png";

export default function View() {
  return (
    <div className={styles["view"]} id="printableArea">
      <NavbarElement />
      <div className={styles["tournament"]}>
        <div>
          <img src={Banner} alt="Torneo de Pesca" />
        </div>
        <Leaderboard />
      </div>
    </div>
  );
}
