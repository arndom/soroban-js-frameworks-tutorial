import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";

type FrameworkItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  img: string;
  to: string;
};

const FrameworkList: FrameworkItem[] = [
  {
    title: "Next.js",
    Svg: require("@site/static/img/nextjs.svg").default,
    img: "",
    to: "/next-integration"
  },
  {
    title: "Nuxt",
    Svg: require("@site/static/img/nuxtjs.svg").default,
    img: "",
    to: "/nuxt-integration"
  },
  {
    title: "SvelteKit",
    Svg: require("@site/static/img/svelte.svg").default,
    img: "",
    to: "/svelte-kit-integration"
  },
];

function Framework({ title, Svg, to }: FrameworkItem) {
  return (
    <Link to={to} className="col col--4">
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>

      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
      </div>
    </Link>
  );
}

export default function Frameworks(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FrameworkList.map((props, idx) => (
            <Framework key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
