/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const CWD = process.cwd();

const React = require('react');
const fs = require('fs');
const classNames = require('classnames');

const siteConfig = require(`${CWD}/siteConfig.js`);
const translation = require('docusaurus/lib/server/translation.js');
const env = require('docusaurus/lib/server/env.js');

const translate = require('docusaurus/lib/server/translate.js').translate;
const setLanguage = require('docusaurus/lib/server/translate.js').setLanguage;

const readMetadata = require('docusaurus/lib/server/readMetadata.js');

readMetadata.generateMetadataDocs();
const Metadata = require('docusaurus/lib/core/metadata.js');
const {idx, getPath} = require('docusaurus/lib/core/utils.js');

const extension = siteConfig.cleanUrl ? '' : '.html';
const Button = require('../Button');

// language dropdown nav item for when translations are enabled
class LanguageDropDown extends React.Component {
  render() {
    setLanguage(this.props.language || 'en');
    const helpTranslateString = translate(
      'Help Translate|recruit community translators for your project',
    );
    // add all enabled languages to dropdown
    const enabledLanguages = env.translation
      .enabledLanguages()
      .filter(lang => lang.tag !== this.props.language)
      .map(lang => {
        // build the href so that we try to stay in current url but change the language.
        let href = siteConfig.baseUrl + lang.tag;
        if (
          this.props.current &&
          this.props.current.permalink &&
          this.props.language
        ) {
          href =
            siteConfig.baseUrl +
            this.props.current.permalink.replace(
              `/${this.props.language}/`,
              `/${lang.tag}/`,
            );
        } else if (this.props.current.id && this.props.current.id !== 'index') {
          href = `${siteConfig.baseUrl + lang.tag}/${this.props.current.id}`;
        }
        return (
          <li key={lang.tag}>
            <a href={getPath(href, this.props.cleanUrl)}>{lang.name}</a>
          </li>
        );
      });
    // if no languages are enabled besides English, return null
    if (enabledLanguages.length < 1) {
      return null;
    }

    // Get the current language full name for display in the header nav
    const currentLanguage = env.translation
      .enabledLanguages()
      .filter(lang => lang.tag === this.props.language)
      .map(lang => lang.name);

    // add Crowdin project recruiting link
    if (siteConfig.translationRecruitingLink) {
      enabledLanguages.push(
        <li key="recruiting">
          <a
            href={siteConfig.translationRecruitingLink}
            target="_blank"
            rel="noreferrer noopener">
            {helpTranslateString}
          </a>
        </li>,
      );
    }

    return (
      <span>
        <li key="languages">
          <a id="languages-menu" href="#">
            <img
              className="languages-icon"
              src={`${this.props.baseUrl}img/language.svg`}
              alt="Languages icon"
            />
            {currentLanguage}
          </a>
          <div id="languages-dropdown" className="hide">
            <ul id="languages-dropdown-items">{enabledLanguages}</ul>
          </div>
        </li>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        const languagesMenuItem = document.getElementById("languages-menu");
        const languagesDropDown = document.getElementById("languages-dropdown");
        languagesMenuItem.addEventListener("click", function(event) {
          event.preventDefault();

          if (languagesDropDown.className == "hide") {
            languagesDropDown.className = "visible";
          } else {
            languagesDropDown.className = "hide";
          }
        });
      `,
          }}
        />
      </span>
    );
  }
}

// header navbar used by all pages generated with docusaurus
class HeaderNav extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return `${baseUrl}docs/${language ? `${language}/` : ''}${doc}`;
  }

  pageUrl(page, language) {
    return siteConfig.baseUrl + (language ? `${language}/` : '') + page;
  }

  // function to generate each header link, used with each object in siteConfig.headerLinks
  makeLinks(link) {
    let href;
    let docItemActive = false;
    let docGroupActive = false;
    link.search = false;
    if (link.search && this.props.config.algolia) {
      // return algolia search bar
      return (
        <li className="navSearchWrapper reactNavSearchWrapper" key="search">
          <input
            id="search_input_react"
            type="text"
            placeholder="Search"
            title="Search"
          />
        </li>
      );
    }
    if (link.languages) {
      if (
        env.translation.enabled &&
        env.translation.enabledLanguages().length > 1
      ) {
        return (
          <LanguageDropDown
            baseUrl={this.props.baseUrl}
            language={this.props.language}
            current={this.props.current}
            cleanUrl={this.props.config.cleanUrl}
            key="languagedropdown"
          />
        );
      }
      return null;
    }
    if (link.doc) {
      // set link to document with current page's language/version
      const langPart = env.translation.enabled
        ? `${this.props.language || 'en'}-`
        : '';
      const versionPart =
        env.versioning.enabled && this.props.version !== 'next'
          ? `version-${this.props.version || env.versioning.defaultVersion}-`
          : '';
      const id = langPart + versionPart + link.doc;
      if (!Metadata[id]) {
        let errorStr = `Processing the following \`doc\` field in \`headerLinks\` within \`siteConfig.js\`: '${
          link.doc
        }'`;
        if (id === link.doc) {
          errorStr +=
            ' It looks like there is no document with that id that exists in your docs directory. Please double check the spelling of your `doc` field and the `id` fields of your docs.';
        } else {
          errorStr += `${'. Check the spelling of your `doc` field. If that seems sane, and a document in your docs folder exists with that `id` value, \nthen this is likely a bug in Docusaurus.' +
            ' Docusaurus thinks one or both of translations (currently set to: '}${
            env.translation.enabled
          }) or versioning (currently set to: ${
            env.versioning.enabled
          }) is enabled when maybe they should not be. \nThus my internal id for this doc is: '${id}'. Please file an issue for this possible bug on GitHub.`;
        }
        throw new Error(errorStr);
      }
      href =
        this.props.config.baseUrl +
        getPath(Metadata[id].permalink, this.props.config.cleanUrl);

      const {id: currentID, sidebar} = this.props.current;
      docItemActive = currentID && currentID === id;
      docGroupActive = sidebar && sidebar === Metadata[id].sidebar;
    } else if (link.page) {
      // set link to page with current page's language if appropriate
      const language = this.props.language || '';
      if (fs.existsSync(`${CWD}/pages/en/${link.page}.js`)) {
        href =
          siteConfig.baseUrl +
          (env.translation.enabled ? `${language}/` : '') +
          link.page +
          extension;
      } else {
        href = siteConfig.baseUrl + link.page + extension;
      }
    } else if (link.href) {
      // set link to specified href
      href = link.href;
    } else if (link.blog) {
      // set link to blog url
      href = `${this.props.baseUrl}blog/`;
    }
    const itemClasses = classNames({
      siteNavGroupActive:
        (link.doc && docGroupActive) || (link.blog && this.props.current.blog),
      siteNavItemActive:
        docItemActive ||
        (link.blog && this.props.current.blogListing) ||
        (link.page && link.page === this.props.current.id),
    });
    const i18n = translation[this.props.language];
    const subLink = link.links&&link.links.length>0;

    const normalItem = href?
      (<a className={'menuItem'}
          href={href}
          target={href.startsWith('//')||href.startsWith('http') ? '_blank' : '_self'}>
        {idx(i18n, ['localized-strings', 'links', link.label]) || link.label}
      </a>):
      (<a className={'menuItem headerItem'}>
        {idx(i18n, ['localized-strings', 'links', link.name]) || link.name}
        <icon className={'fas fa-caret-down smallIcon '+(subLink?'':'hidden')} ></icon>
      </a>)

    var subMenu = subLink&&(<div className={'subMenuContainer displayNone'}>
      {link.links.map((aLink,index)=>{
      let href = (aLink.href.startsWith('http')||aLink.href.startsWith('//')||aLink.href.startsWith('#'))?
        aLink.href:
        (aLink.href.endsWith('html')?this.pageUrl(aLink.href):this.docUrl(aLink.href, this.props.language));
      return <a href={href}
                key={'reference_'+index}
                target={href.startsWith('//')||href.startsWith('http') ? '_blank' : '_self'} >{aLink.name}
              </a>;
    })}</div>);
    return (
      <li key={`${link.label}page`} className={'liMenu '+itemClasses}>
        {normalItem}
        {subMenu}
      </li>
    );
  }

  renderResponsiveNav(headerLinks) {
    // add language drop down to end if location not specified
    let languages = false;
    headerLinks.forEach(link => {
      if (link.languages) {
        languages = true;
      }
    });
    let search = false;
    headerLinks.forEach(link => {
      if (
        link.doc &&
        !fs.existsSync(`${CWD}/../${readMetadata.getDocsPath()}/`)
      ) {
        throw new Error(
          `You have 'doc' in your headerLinks, but no '${readMetadata.getDocsPath()}' folder exists one level up from ` +
            `'website' folder. Did you run \`docusaurus-init\` or \`npm run examples\`? If so, ` +
            `make sure you rename 'docs-examples-from-docusaurus' to 'docs'.`,
        );
      }
      if (link.blog && !fs.existsSync(`${CWD}/blog/`)) {
        throw new Error(
          "You have 'blog' in your headerLinks, but no 'blog' folder exists in your " +
            "'website' folder. Did you run `docusaurus-init` or `npm run examples`? If so, " +
            "make sure you rename 'blog-examples-from-docusaurus' to 'blog'.",
        );
      }
      if (link.page && !fs.existsSync(`${CWD}/pages/`)) {
        throw new Error(
          "You have 'page' in your headerLinks, but no 'pages' folder exists in your " +
            "'website' folder.",
        );
      }
      // We will add search bar to end if location not specified
      if (link.search) {
        search = true;
      }
    });
    return (
      <div className="navigationWrapper navigationSlider">
        <nav className="slidingNav">
          <ul className="nav-site nav-site-internal">
            {headerLinks.map(this.makeLinks, this)}
          </ul>
        </nav>
      </div>
    );
  }

  render() {
    var headerIcon = false;
    const headerClass = headerIcon
      ? 'headerTitleWithLogo'
      : 'headerTitle';
    const versionsLink =
      this.props.baseUrl +
      (env.translation.enabled
        ? `${this.props.language}/versions${extension}`
        : `versions${extension}`);
    return (
      <div>
        <div className="fixedHeaderContainer">
          <div className="headerWrapper wrapper">
            <header>
              <span>{this.props.version}</span>
              <Button href={siteConfig.references.release.href}>{siteConfig.references.release.name}</Button>
              {this.renderResponsiveNav( this.props.config.overwritedHeaderLinks)}
            </header>
          </div>
        </div>
        <div className="primaryMenuBarContainer fixedHeaderContainer">
          <div className="headerWrapper wrapper">
            <header>
              <a
                href={this.props.config.logoLink }>
                  <img
                    className="logo"
                    src={this.props.config.headerIcon}
                    alt={siteConfig.title}
                  />
              </a>
              {this.renderResponsiveNav( this.props.config.primaryHeaderLinks)}
            </header>
          </div>
        </div>
      </div>
    );
  }
}

HeaderNav.defaultProps = {
  current: {},
};

module.exports = HeaderNav;
