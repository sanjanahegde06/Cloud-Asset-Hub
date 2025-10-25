import React from 'react';
import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Cloud Asset Hub</title>
        <meta name="description" content="Cloud Asset Hub — manage your cloud assets and documents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  )
}