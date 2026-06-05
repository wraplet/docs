import React from "react";
import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/getting-started/what-is-wraplet/introduction"
            >
              Introduction
            </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Wraplet is a small TypeScript framework for building lifecycle-aware, type-safe components on top of real DOM – ideal for server-rendered apps, jQuery migrations, multipage sites, and JS/TS libraries.">
      <HomepageHeader />
        <main>
          <div className={clsx('container', "margin-top--lg")}>
              <p>
                  <strong>wraplet</strong> is a small JavaScript/TypeScript framework for projects that work directly with the actual DOM (server-rendered apps, jQuery legacy, multipage sites, plain HTML, libraries shipping DOM components, etc.).
              </p>
          </div>
          <HomepageFeatures />
            <div className={clsx('container', 'homepage-demo')}>
              <h2>Live demo</h2>
              <p>You can freely edit all examples in this documentation and see the results instantly.</p>
              <p>Explore the type-hints in the editor.</p>
              <div className={"statement"}><strong>Fun fact</strong>: all live demos on this website, are made with the <strong><a href="https://exhibitionjs.wraplet.dev">ExhibitionJS</a></strong> library that is powered by <strong>Wraplet</strong>!</div>
              <BrowserOnly fallback={<div>Loading...</div>}>
                  {() => {
                      const Example = require("@site/src/components/Example").default;
                      const MonacoEditor = require("@site/src/components/MonacoEditor").default;
                      return (
                          <div>
                              <h3>Calculator example</h3>
                              <Example style="small">
                                  <h4>HTML</h4>
                                  <MonacoEditor contentUrl="/examples/calculator/html.htm" language="html" height="370px" />
                                  <h4>TypeScript</h4>
                                  <MonacoEditor contentUrl="/examples/calculator/typescript.txt" language="typescript" height="800px" />
                                  <div className="help-text">
                                      <p>Preview will be updated instantly</p>
                                  </div>
                              </Example>
                          </div>
                      );
                  }}
              </BrowserOnly>
            </div>
        </main>
    </Layout>
  );
}
