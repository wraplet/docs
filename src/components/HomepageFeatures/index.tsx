import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>> | null;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
      title: 'Real DOM, not a virtual layer',
      Svg: null, // require('@site/static/img/undraw_docusaurus_react.svg').default,
      description: (
        <>
            <p>
                Work directly with the interface you already have.
            </p>
            <p>
                Wraplet organizes code around real DOM elements, making it a natural fit for server-rendered pages,
                existing markup, and gradual frontend evolution.
            </p>
        </>
      ),
    },
    {
      title: 'Predictable lifecycle and dependencies',
      Svg: null, // require('@site/static/img/undraw_docusaurus_react.svg').default,
      description: (
        <>
            <p>
                Turn DOM elements into structured components.
            </p>
            <p>
                Give components clear initialization, cleanup, and typed relationships, so larger interfaces
                stay understandable and easier to maintain.
            </p>
        </>
      ),
    },
    {
      title: 'Progressive modernization',
      Svg: null, // require('@site/static/img/undraw_docusaurus_react.svg').default,
      description: (
        <>
            <p>
                Add architecture without rewriting everything.
            </p>
            <p>
                Wraplet helps teams introduce order into legacy or growing frontends step by step,
                without committing to a full SPA migration.
            </p>
        </>
      ),
    },
    {
      title: 'Small footprint',
      Svg: null,
      description: (
        <>
            <p>
                Just ~5&nbsp;kB gzipped.
            </p>
            <p>
                Wraplet stays out of your way and your bundle. It adds structure to your frontend
                without dragging in a heavy runtime, making it a safe choice for libraries, widgets,
                and performance-sensitive pages.
            </p>
        </>
      ),
    },
    {
      title: 'Readable code',
      Svg: null,
      description: (
        <>
            <p>
                Components that read like the UI they describe.
            </p>
            <p>
                Wraplets map directly to DOM elements and declare their children and dependencies
                explicitly, so each class tells a clear story of what it owns, what it needs,
                and what it does.
            </p>
        </>
      ),
    },
    {
      title: 'Easy to understand by LLMs',
      Svg: null,
      description: (
        <>
            <p>
                A small, explicit API that LLMs can reason about.
            </p>
            <p>
                Clear lifecycle hooks, typed dependency maps, and conventional patterns give AI
                assistants enough context to navigate, extend, and refactor your code with
                confidence — not guesswork.
            </p>
        </>
      ),
    },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4 margin-bottom--lg')}>
      {Svg && (
        <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div>
      )}
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <div>{description}</div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
