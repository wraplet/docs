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
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
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
