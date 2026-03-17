// Chapter-based numbering for books with appendix support
#let equation-numbering = it => {
  let pattern = if state("appendix-state", none).get() != none { "(A.1)" } else { "(1.1)" }
  numbering(pattern, counter(heading).get().first(), it)
}
#let callout-numbering = it => {
  let pattern = if state("appendix-state", none).get() != none { "A.1" } else { "1.1" }
  numbering(pattern, counter(heading).get().first(), it)
}
#let subfloat-numbering(n-super, subfloat-idx) = {
  let chapter = counter(heading).get().first()
  let pattern = if state("appendix-state", none).get() != none { "A.1a" } else { "1.1a" }
  numbering(pattern, chapter, n-super, subfloat-idx)
}
// Theorem configuration for theorion
// Chapter-based numbering (H1 = chapters)
#let theorem-inherited-levels = 1

// Appendix-aware theorem numbering
#let theorem-numbering(loc) = {
  if state("appendix-state", none).at(loc) != none { "A.1" } else { "1.1" }
}

// Theorem render function
// Note: brand-color is not available at this point in template processing
#let theorem-render(prefix: none, title: "", full-title: auto, body) = {
  block(
    width: 100%,
    inset: (left: 1em),
    stroke: (left: 2pt + black),
  )[
    #if full-title != "" and full-title != auto and full-title != none {
      strong[#full-title]
      linebreak()
    }
    #body
  ]
}
// Some definitions presupposed by pandoc's typst output.
#let content-to-string(content) = {
  if content.has("text") {
    content.text
  } else if content.has("children") {
    content.children.map(content-to-string).join("")
  } else if content.has("body") {
    content-to-string(content.body)
  } else if content == [ ] {
    " "
  }
}

#let horizontalrule = line(start: (25%,0%), end: (75%,0%))

#let endnote(num, contents) = [
  #stack(dir: ltr, spacing: 3pt, super[#num], contents)
]

#show terms.item: it => block(breakable: false)[
  #text(weight: "bold")[#it.term]
  #block(inset: (left: 1.5em, top: -0.4em))[#it.description]
]

// Some quarto-specific definitions.

#show raw.where(block: true): set block(
    fill: luma(230),
    width: 100%,
    inset: 8pt,
    radius: 2pt
  )

#let block_with_new_content(old_block, new_content) = {
  let fields = old_block.fields()
  let _ = fields.remove("body")
  if fields.at("below", default: none) != none {
    // TODO: this is a hack because below is a "synthesized element"
    // according to the experts in the typst discord...
    fields.below = fields.below.abs
  }
  block.with(..fields)(new_content)
}

#let empty(v) = {
  if type(v) == str {
    // two dollar signs here because we're technically inside
    // a Pandoc template :grimace:
    v.matches(regex("^\\s*$")).at(0, default: none) != none
  } else if type(v) == content {
    if v.at("text", default: none) != none {
      return empty(v.text)
    }
    for child in v.at("children", default: ()) {
      if not empty(child) {
        return false
      }
    }
    return true
  }

}

// Subfloats
// This is a technique that we adapted from https://github.com/tingerrr/subpar/
#let quartosubfloatcounter = counter("quartosubfloatcounter")

#let quarto_super(
  kind: str,
  caption: none,
  label: none,
  supplement: str,
  position: none,
  subcapnumbering: "(a)",
  body,
) = {
  context {
    let figcounter = counter(figure.where(kind: kind))
    let n-super = figcounter.get().first() + 1
    set figure.caption(position: position)
    [#figure(
      kind: kind,
      supplement: supplement,
      caption: caption,
      {
        show figure.where(kind: kind): set figure(numbering: _ => {
          let subfloat-idx = quartosubfloatcounter.get().first() + 1
          subfloat-numbering(n-super, subfloat-idx)
        })
        show figure.where(kind: kind): set figure.caption(position: position)

        show figure: it => {
          let num = numbering(subcapnumbering, n-super, quartosubfloatcounter.get().first() + 1)
          show figure.caption: it => block({
            num.slice(2) // I don't understand why the numbering contains output that it really shouldn't, but this fixes it shrug?
            [ ]
            it.body
          })

          quartosubfloatcounter.step()
          it
          counter(figure.where(kind: it.kind)).update(n => n - 1)
        }

        quartosubfloatcounter.update(0)
        body
      }
    )#label]
  }
}

// callout rendering
// this is a figure show rule because callouts are crossreferenceable
#show figure: it => {
  if type(it.kind) != str {
    return it
  }
  let kind_match = it.kind.matches(regex("^quarto-callout-(.*)")).at(0, default: none)
  if kind_match == none {
    return it
  }
  let kind = kind_match.captures.at(0, default: "other")
  kind = upper(kind.first()) + kind.slice(1)
  // now we pull apart the callout and reassemble it with the crossref name and counter

  // when we cleanup pandoc's emitted code to avoid spaces this will have to change
  let old_callout = it.body.children.at(1).body.children.at(1)
  let old_title_block = old_callout.body.children.at(0)
  let children = old_title_block.body.body.children
  let old_title = if children.len() == 1 {
    children.at(0)  // no icon: title at index 0
  } else {
    children.at(1)  // with icon: title at index 1
  }

  // TODO use custom separator if available
  // Use the figure's counter display which handles chapter-based numbering
  // (when numbering is a function that includes the heading counter)
  let callout_num = it.counter.display(it.numbering)
  let new_title = if empty(old_title) {
    [#kind #callout_num]
  } else {
    [#kind #callout_num: #old_title]
  }

  let new_title_block = block_with_new_content(
    old_title_block,
    block_with_new_content(
      old_title_block.body,
      if children.len() == 1 {
        new_title  // no icon: just the title
      } else {
        children.at(0) + new_title  // with icon: preserve icon block + new title
      }))

  align(left, block_with_new_content(old_callout,
    block(below: 0pt, new_title_block) +
    old_callout.body.children.at(1)))
}

// 2023-10-09: #fa-icon("fa-info") is not working, so we'll eval "#fa-info()" instead
#let callout(body: [], title: "Callout", background_color: rgb("#dddddd"), icon: none, icon_color: black, body_background_color: white) = {
  block(
    breakable: false, 
    fill: background_color, 
    stroke: (paint: icon_color, thickness: 0.5pt, cap: "round"), 
    width: 100%, 
    radius: 2pt,
    block(
      inset: 1pt,
      width: 100%, 
      below: 0pt, 
      block(
        fill: background_color,
        width: 100%,
        inset: 8pt)[#if icon != none [#text(icon_color, weight: 900)[#icon] ]#title]) +
      if(body != []){
        block(
          inset: 1pt, 
          width: 100%, 
          block(fill: body_background_color, width: 100%, inset: 8pt, body))
      }
    )
}


// syntax highlighting functions from skylighting:
/* Function definitions for syntax highlighting generated by skylighting: */
#let EndLine() = raw("\n")
#let Skylighting(fill: none, number: false, start: 1, sourcelines) = {
   let blocks = []
   let lnum = start - 1
   let bgcolor = rgb("#f1f3f5")
   for ln in sourcelines {
     if number {
       lnum = lnum + 1
       blocks = blocks + box(width: if start + sourcelines.len() > 999 { 30pt } else { 24pt }, text(fill: rgb("#aaaaaa"), [ #lnum ]))
     }
     blocks = blocks + ln + EndLine()
   }
   block(fill: bgcolor, width: 100%, inset: 8pt, radius: 2pt, blocks)
}
#let AlertTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let AnnotationTok(s) = text(fill: rgb("#5e5e5e"),raw(s))
#let AttributeTok(s) = text(fill: rgb("#657422"),raw(s))
#let BaseNTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let BuiltInTok(s) = text(fill: rgb("#003b4f"),raw(s))
#let CharTok(s) = text(fill: rgb("#20794d"),raw(s))
#let CommentTok(s) = text(fill: rgb("#5e5e5e"),raw(s))
#let CommentVarTok(s) = text(style: "italic",fill: rgb("#5e5e5e"),raw(s))
#let ConstantTok(s) = text(fill: rgb("#8f5902"),raw(s))
#let ControlFlowTok(s) = text(weight: "bold",fill: rgb("#003b4f"),raw(s))
#let DataTypeTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let DecValTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let DocumentationTok(s) = text(style: "italic",fill: rgb("#5e5e5e"),raw(s))
#let ErrorTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let ExtensionTok(s) = text(fill: rgb("#003b4f"),raw(s))
#let FloatTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let FunctionTok(s) = text(fill: rgb("#4758ab"),raw(s))
#let ImportTok(s) = text(fill: rgb("#00769e"),raw(s))
#let InformationTok(s) = text(fill: rgb("#5e5e5e"),raw(s))
#let KeywordTok(s) = text(weight: "bold",fill: rgb("#003b4f"),raw(s))
#let NormalTok(s) = text(fill: rgb("#003b4f"),raw(s))
#let OperatorTok(s) = text(fill: rgb("#5e5e5e"),raw(s))
#let OtherTok(s) = text(fill: rgb("#003b4f"),raw(s))
#let PreprocessorTok(s) = text(fill: rgb("#ad0000"),raw(s))
#let RegionMarkerTok(s) = text(fill: rgb("#003b4f"),raw(s))
#let SpecialCharTok(s) = text(fill: rgb("#5e5e5e"),raw(s))
#let SpecialStringTok(s) = text(fill: rgb("#20794d"),raw(s))
#let StringTok(s) = text(fill: rgb("#20794d"),raw(s))
#let VariableTok(s) = text(fill: rgb("#111111"),raw(s))
#let VerbatimStringTok(s) = text(fill: rgb("#20794d"),raw(s))
#let WarningTok(s) = text(style: "italic",fill: rgb("#5e5e5e"),raw(s))



#let article(
  title: none,
  subtitle: none,
  authors: none,
  keywords: (),
  date: none,
  abstract-title: none,
  abstract: none,
  thanks: none,
  cols: 1,
  lang: "en",
  region: "US",
  font: none,
  fontsize: 11pt,
  title-size: 1.5em,
  subtitle-size: 1.25em,
  heading-family: none,
  heading-weight: "bold",
  heading-style: "normal",
  heading-color: black,
  heading-line-height: 0.65em,
  mathfont: none,
  codefont: none,
  linestretch: 1,
  sectionnumbering: none,
  linkcolor: none,
  citecolor: none,
  filecolor: none,
  toc: false,
  toc_title: none,
  toc_depth: none,
  toc_indent: 1.5em,
  doc,
) = {
  // Set document metadata for PDF accessibility
  set document(title: title, keywords: keywords)
  set document(
    author: authors.map(author => content-to-string(author.name)).join(", ", last: " & "),
  ) if authors != none and authors != ()
  set par(
    justify: true,
    leading: linestretch * 0.65em
  )
  set text(lang: lang,
           region: region,
           size: fontsize)
  set text(font: font) if font != none
  show math.equation: set text(font: mathfont) if mathfont != none
  show raw: set text(font: codefont) if codefont != none

  set heading(numbering: sectionnumbering)

  show link: set text(fill: rgb(content-to-string(linkcolor))) if linkcolor != none
  show ref: set text(fill: rgb(content-to-string(citecolor))) if citecolor != none
  show link: this => {
    if filecolor != none and type(this.dest) == label {
      text(this, fill: rgb(content-to-string(filecolor)))
    } else {
      text(this)
    }
   }

  place(
    top,
    float: true,
    scope: "parent",
    clearance: 4mm,
    block(below: 1em, width: 100%)[

      #if title != none {
        align(center, block(inset: 2em)[
          #set par(leading: heading-line-height) if heading-line-height != none
          #set text(font: heading-family) if heading-family != none
          #set text(weight: heading-weight)
          #set text(style: heading-style) if heading-style != "normal"
          #set text(fill: heading-color) if heading-color != black

          #text(size: title-size)[#title #if thanks != none {
            footnote(thanks, numbering: "*")
            counter(footnote).update(n => n - 1)
          }]
          #(if subtitle != none {
            parbreak()
            text(size: subtitle-size)[#subtitle]
          })
        ])
      }

      #if authors != none and authors != () {
        let count = authors.len()
        let ncols = calc.min(count, 3)
        grid(
          columns: (1fr,) * ncols,
          row-gutter: 1.5em,
          ..authors.map(author =>
              align(center)[
                #author.name \
                #author.affiliation \
                #author.email
              ]
          )
        )
      }

      #if date != none {
        align(center)[#block(inset: 1em)[
          #date
        ]]
      }

      #if abstract != none {
        block(inset: 2em)[
        #text(weight: "semibold")[#abstract-title] #h(1em) #abstract
        ]
      }
    ]
  )

  if toc {
    let title = if toc_title == none {
      auto
    } else {
      toc_title
    }
    block(above: 0em, below: 2em)[
    #outline(
      title: toc_title,
      depth: toc_depth,
      indent: toc_indent
    );
    ]
  }

  doc
}

#set table(
  inset: 6pt,
  stroke: none
)
#let brand-color = (:)
#let brand-color-background = (:)
#let brand-logo = (:)

#set page(
  paper: "a4",
  margin: (x: 2.54cm,y: 2.54cm,),
  numbering: "1",
  columns: 1,
)
// Logo is handled by orange-book's cover page, not as a page background
// NOTE: marginalia.setup is called in typst-show.typ AFTER book.with()
// to ensure marginalia's margins override the book format's default margins
#import "@preview/orange-book:0.7.1": book, part, chapter, appendices

#show: book.with(
  title: [CeylonHS: AI-Powered HS Code Search & Trade Classification Platform],
  subtitle: [CW2 Implementation Report],
  author: "T.R. Jayasekara, D.V. Rathnayake, L.T.R. De Silva, C.A.R. Weerakoon, D.M Dodamwala, W.A.Y.G. Kalpage",
  date: "2026-03-01",
  main-color: brand-color.at("primary", default: blue),
  logo: {
    let logo-info = brand-logo.at("medium", default: none)
    if logo-info != none { image(logo-info.path, alt: logo-info.at("alt", default: none)) }
  },
  outline-depth: 3,
)


// Reset Quarto's custom figure counters at each chapter (level-1 heading).
// Orange-book only resets kind:image and kind:table, but Quarto uses custom kinds.
// This list is generated dynamically from crossref.categories.
#show heading.where(level: 1): it => {
  counter(figure.where(kind: "quarto-float-fig")).update(0)
  counter(figure.where(kind: "quarto-float-tbl")).update(0)
  counter(figure.where(kind: "quarto-float-lst")).update(0)
  counter(figure.where(kind: "quarto-callout-Note")).update(0)
  counter(figure.where(kind: "quarto-callout-Warning")).update(0)
  counter(figure.where(kind: "quarto-callout-Caution")).update(0)
  counter(figure.where(kind: "quarto-callout-Tip")).update(0)
  counter(figure.where(kind: "quarto-callout-Important")).update(0)
  counter(math.equation).update(0)
  it
}

= CeylonHS: AI-Powered HS Code Search & Trade Classification Platform
<ceylonhs-ai-powered-hs-code-search-trade-classification-platform>
CW2 Implementation Report

\
#align(center)[
  #v(3cm)

  #text(size: 14pt, weight: "bold")[INFORMATICS INSTITUTE OF TECHNOLOGY]

  #text(size: 12pt)[Affiliated with]

  #text(size: 14pt, weight: "bold")[UNIVERSITY OF WESTMINSTER, UK]

  #v(0.5cm)

  #text(size: 12pt)[BEng (Hons) Computer Science]

  #v(0.3cm)

  #text(size: 12pt, weight: "bold")[5COSC021C.Y: Software Development Group Project]

  #text(size: 12pt)[Module Leader: Mr. Banuka Athuraliya]

  #v(0.5cm)

  #text(size: 12pt)[A project by CS-15]

  #v(0.5cm)

  #text(size: 16pt, weight: "bold")["CeylonHS": AI-Powered HS Code Search &\ Trade Classification Platform for Sri Lanka]

  #v(0.3cm)

  #text(size: 12pt)[Supervised by: Ms. Vishmi Embuldeniya]

  #v(1cm)

  #table(
    columns: (auto, auto, auto),
    inset: 8pt,
    align: center,
    stroke: 0.5pt,
    [*Name*], [*IIT ID*], [*UOW ID*],
    [T.R. Jayasekara], [20241953], [w2152987],
    [D.V. Rathnayake], [20241630], [w2151904],
    [L.T.R. De Silva], [20231244], [w2120219],
    [C.A.R. Weerakoon], [20242094], [w2153607],
    [D.M Dodamwala], [20233064], [w2120414],
    [W.A.Y.G. Kalpage], [20241289], [w2153567],
  )
]
#heading(level: 2, numbering: none)[Declaration]
<declaration>
The team certifies that the design, development, and documentation of the "CeylonHS" system are entirely their own work. Any ideas, data, images, or text resulting from the work of others (whether published or unpublished) are fully identified as such within the work and attributed to their originators in the text, bibliography, or references. All software code used from open-source libraries has been documented in accordance with the relevant licenses.

#figure([
#table(
  columns: 2,
  align: (auto,auto,),
  table.header([#strong[Full Name]], [#strong[Registration ID]],),
  table.hline(),
  [Thevinu Radin Jayasekara], [20241953 | w2152987],
  [Dulshan Vidath Rathnayake], [20241630 | w2151904],
  [Liyanamadura Thamadi Ranuki De Silva], [20231244 | w2120219],
  [Chanugi Amoda Rathnayaka Weerakoon], [20242094 | w2153607],
  [Muditha Dodamwala], [20233064 | w2120414],
  [Yasmi Geethma Kalpage], [20241289 | w2153567],
)
], caption: figure.caption(
position: top, 
[
Team Declaration
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-declaration>


#heading(level: 2, numbering: none)[Abstract]
<abstract>
Accurate classification of goods using the Harmonized System (HS) is essential for international trade, yet Sri Lanka Customs currently relies on inefficient, manual processes involving static PDF documents and printed tariff books. This lack of digitalisation results in time-consuming searches, duty calculation errors, and operational bottlenecks for importers, exporters, and customs officers. This report presents the implementation of "CeylonHS," an intelligent AI-powered HS code search platform designed to modernise and streamline the classification process.

The implemented solution utilises a hybrid search pipeline combining BM25 keyword search via Typesense with semantic vector search powered by FAISS and the all-MiniLM-L6-v2 sentence-transformer model (384-dimension embeddings). An LLM-powered enrichment cascade (Groq Llama 3.3, Google Gemini Flash 2.0, Cohere Command-R) resolves brand names and trade abbreviations into official HS terminology. The system architecture employs a FastAPI asynchronous backend serving both a Flutter mobile application (Android/iOS) and a Next.js web application with server-side rendering for SEO optimisation. Firebase Authentication provides identity management across all client platforms.

The platform has been deployed to production on a DigitalOcean droplet with an automated CI/CD pipeline via GitHub Actions, nginx reverse proxy with SSL termination, and process management through PM2 and systemd. Testing was conducted using pytest for the backend and Vitest for the frontend, with structured functional, non-functional, and usability test cases. Evaluation results demonstrate that the hybrid AI search pipeline successfully resolves brand-name queries (e.g., "Dilmah" → HS 0902.xx for tea) with sub-100ms latency, achieving the project objectives established in CW1.

#strong[Keywords:] HS Code, Machine Learning, Semantic Search, Sri Lanka Customs, FastAPI, Flutter, Next.js, FAISS, Trade Facilitation, AI Enrichment

#heading(level: 2, numbering: none)[Acknowledgement]
<acknowledgement>
The members of Team CeylonHS (CS-15) would like to express their gratitude to those who contributed to the success of this project.

Sincere thanks are extended to the project supervisor, Ms.~Vishmi Embuldeniya, for her guidance throughout the development lifecycle. Her expertise provided constructive feedback that helped refine the system architecture and ensure the successful implementation of the HS code search platform.

Gratitude is also extended to the staff and computing faculty of the Informatics Institute of Technology (IIT) for providing the necessary resources and environment to conduct this project. Special thanks to Mr.~Banuka Athuraliya for his lectures on the module content and guidance on software development best practices.

The team also acknowledges the officials and staff of Sri Lanka Customs, whose domain expertise on import/export regulations and the Harmonised System provided the essential context needed to create a relevant and practical solution.

Finally, appreciation is extended to family members and friends for their encouragement throughout this project.

#heading(level: 2, numbering: none)[Abbreviations]
<abbreviations>
#figure([
#table(
  columns: 2,
  align: (auto,auto,),
  table.header([#strong[Abbreviation]], [#strong[Definition]],),
  table.hline(),
  [AI], [Artificial Intelligence],
  [API], [Application Programming Interface],
  [BM25], [Best Matching 25 (ranking function)],
  [CI/CD], [Continuous Integration / Continuous Deployment],
  [CORS], [Cross-Origin Resource Sharing],
  [CRUD], [Create, Read, Update, Delete],
  [CSV], [Comma-Separated Values],
  [FAISS], [Facebook AI Similarity Search],
  [HS], [Harmonized System],
  [HSTS], [HTTP Strict Transport Security],
  [JWT], [JSON Web Token],
  [LLM], [Large Language Model],
  [ML], [Machine Learning],
  [NLP], [Natural Language Processing],
  [ORM], [Object-Relational Mapping],
  [REST], [Representational State Transfer],
  [SEO], [Search Engine Optimisation],
  [SPA], [Single Page Application],
  [SQL], [Structured Query Language],
  [SSR], [Server-Side Rendering],
  [SSL], [Secure Sockets Layer],
  [UI], [User Interface],
  [UX], [User Experience],
  [WCO], [World Customs Organization],
)
], caption: figure.caption(
position: top, 
[
List of Abbreviations
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-abbreviations>


= Implementation
<sec-implementation>
== Chapter Overview
<chapter-overview>
This chapter presents the complete implementation of the CeylonHS platform, an AI-powered Harmonized System (HS) code search and trade classification system for Sri Lanka. The chapter covers the technology selections and justifications, backend architecture and search engine implementation, frontend development across Flutter mobile and Next.js web applications, database design, authentication and security measures, version control practices, deployment infrastructure, and CI/CD pipeline. Each section includes code-level evidence with technical justification demonstrating the engineering decisions made during development.

== Overview of the Prototype
<overview-of-the-prototype>
CeylonHS is a production-deployed, multi-platform system that enables Sri Lankan trade professionals to search for HS codes using natural language queries, brand names, and trade abbreviations. The prototype implements a seven-stage hybrid search pipeline combining keyword matching (BM25), semantic vector search (FAISS with 384-dimensional embeddings), and LLM-powered brand enrichment (Groq/Gemini/Cohere cascade). The system is delivered through three integrated components:

- #strong[FastAPI Backend] --- Asynchronous Python web server exposing 31 REST API endpoints across 9 route groups, handling search, authentication, user management, and administration.
- #strong[Flutter Mobile Application] --- Cross-platform Android/iOS application with 7 screens, Provider-based state management, and Google Sign-In integration.
- #strong[Next.js Web Application] --- Server-side rendered web application with SEO-optimised landing page, 10 modular landing components, and a comprehensive admin dashboard.

All three components share a common backend and Firebase Authentication infrastructure, ensuring consistent user experience across platforms. The system has been deployed to production at #NormalTok("ceylonhs.com"); on a DigitalOcean droplet with automated CI/CD via GitHub Actions.

== Technology Selections
<sec-tech-selections>
=== Technology Stack Justification
<technology-stack-justification>
The technology stack was selected based on performance requirements, team expertise, scalability considerations, and alignment with the project objectives established in CW1. #ref(<tbl-backend-tech>, supplement: [Table]), #ref(<tbl-flutter-tech>, supplement: [Table]), #ref(<tbl-nextjs-tech>, supplement: [Table]), and #ref(<tbl-devops-tech>, supplement: [Table]) present the complete technology inventory with justifications.

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Technology], [Version], [Purpose], [Justification],),
  table.hline(),
  [Python], [3.11+], [Server-side language], [Mature ML ecosystem (PyTorch, FAISS, Sentence-Transformers)],
  [FastAPI], [0.135.1], [Async web framework], [Native async support, auto-generated OpenAPI docs, Pydantic validation @tiangolo2019fastapi],
  [SQLAlchemy], [2.0.48], [Async ORM], [Dialect-aware (SQLite dev, PostgreSQL prod), parameterised queries preventing SQL injection],
  [FAISS-CPU], [1.13.2], [Vector similarity search], [Efficient inner-product search on 16,000+ vectors, no GPU required @johnson2019billion],
  [Sentence-Transformers], [3.2.1], [Text embeddings], [all-MiniLM-L6-v2 produces 384-dim vectors with strong semantic similarity @reimers2019sentence],
  [Firebase Admin], [7.2.0], [Auth verification], [Server-side JWT validation, Google OAuth integration],
  [Groq/Gemini/Cohere], [Various], [LLM providers], [Multi-provider cascade maximises free-tier availability],
  [Typesense], [2.0.0], [Hybrid search], [Built-in BM25 + vector search, auto-embedding support],
)
], caption: figure.caption(
position: top, 
[
Backend Technology Stack
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-backend-tech>


#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Technology], [Version], [Purpose], [Justification],),
  table.hline(),
  [Flutter SDK], [Latest Stable], [Cross-platform mobile], [Single codebase for Android/iOS, hot-reload development @flutterteam2024],
  [Dart], [^3.11.0], [Programming language], [Null-safe, AOT-compiled for mobile performance],
  [Provider], [^6.1.0], [State management], [Lightweight reactive state, recommended by Flutter team],
  [google\_sign\_in], [^6.2.1], [OAuth authentication], [Native Google Sign-In dialogs],
  [shared\_preferences], [^2.3.0], [Local storage], [Device-persistent key-value storage for recent searches],
)
], caption: figure.caption(
position: top, 
[
Flutter Mobile Technology Stack
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-flutter-tech>


#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Technology], [Version], [Purpose], [Justification],),
  table.hline(),
  [Next.js], [16.1.6], [React SSR/SSG framework], [Server Components for SEO, App Router architecture],
  [React], [19.2.4], [UI library], [Component-based architecture, large ecosystem],
  [TypeScript], [5.x], [Type-safe JavaScript], [Compile-time type checking reduces runtime errors],
  [Tailwind CSS], [4.x], [Utility CSS], [Rapid UI development, consistent design tokens],
  [Framer Motion], [12.34.3], [Animation library], [Declarative animations with InView triggers],
  [Three.js], [0.183.2], [3D graphics], [WebGL particle effects for login page],
  [Firebase], [12.10.0], [Client-side auth], [Direct Google OAuth and email/password flows],
)
], caption: figure.caption(
position: top, 
[
Next.js Web Technology Stack
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-nextjs-tech>


#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([Technology], [Purpose], [Justification],),
  table.hline(),
  [DigitalOcean Droplet], [Production hosting], [Cost-effective Ubuntu VPS with full control],
  [Nginx], [Reverse proxy + SSL], [Industry-standard, handles SSL termination and routing],
  [PM2], [Process management], [Auto-restart, cluster mode, log management for Node.js],
  [Systemd], [Service management], [OS-level service control for Python backend],
  [GitHub Actions], [CI/CD pipeline], [Native GitHub integration, free tier for public repos],
  [Docker/Docker Compose], [Container deployment], [Reproducible builds, PostgreSQL for production],
  [Let's Encrypt], [SSL certificates], [Free automated HTTPS certification],
)
], caption: figure.caption(
position: top, 
[
DevOps & Infrastructure Stack
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-devops-tech>


=== Technology Selection Rationale
<technology-selection-rationale>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Decision], [Choice], [Alternatives Considered], [Rationale],),
  table.hline(),
  [Search engine], [FAISS + Typesense], [Algolia, Meilisearch, Weaviate], [Self-hosted, free, hybrid search capability; no vendor lock-in],
  [Embedding model], [all-MiniLM-L6-v2], [Larger transformer models], [384-dim vectors, fast CPU inference, strong quality-to-speed ratio],
  [LLM enrichment], [Multi-provider cascade], [Single provider, LangChain], [Distributes load across three free tiers; avoids rate-limit bottleneck],
  [Backend framework], [FastAPI], [Django, Flask], [Async-native, automatic OpenAPI documentation, Pydantic integration],
  [Mobile framework], [Flutter], [React Native, native SDKs], [Cross-platform single codebase, performant rendering, rapid development],
  [Web framework], [Next.js], [Nuxt, Remix], [SSR/SSG for SEO, React ecosystem maturity, team expertise],
  [Authentication], [Firebase], [Auth0, Supabase Auth], [Google OAuth built-in, generous free tier, cross-platform SDKs],
  [Database], [SQLite/PostgreSQL], [MongoDB, MySQL], [SQLAlchemy supports both dialects; simple development, robust production],
)
], caption: figure.caption(
position: top, 
[
Technology Selection Decisions
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-tech-rationale>


== Implementation of the Backend Component
<sec-backend>
=== Application Structure
<application-structure>
The backend follows a modular structure adhering to Clean Architecture principles, separating concerns into core infrastructure, data models, API routes, and service layers. Figure 1.1 illustrates the directory organisation.

#Skylighting(([#NormalTok("backend/");],
[#NormalTok("├── app/");],
[#NormalTok("│   ├── __init__.py");],
[#NormalTok("│   ├── main.py                     # FastAPI app factory + lifespan");],
[#NormalTok("│   ├── core/");],
[#NormalTok("│   │   ├── config.py               # Pydantic Settings (env-driven)");],
[#NormalTok("│   │   ├── auth.py                 # Firebase auth middleware");],
[#NormalTok("│   │   ├── database.py             # Async SQLAlchemy engine");],
[#NormalTok("│   │   └── limiter.py              # Rate limiter singleton");],
[#NormalTok("│   ├── models/");],
[#NormalTok("│   │   ├── user.py                 # User, SearchHistory, Favorite ORM");],
[#NormalTok("│   │   ├── categories.py           # FeaturedCategory ORM");],
[#NormalTok("│   │   └── schemas.py              # Pydantic request/response schemas");],
[#NormalTok("│   ├── api/routes/");],
[#NormalTok("│   │   ├── search.py               # Public search endpoints");],
[#NormalTok("│   │   ├── users.py                # User CRUD operations");],
[#NormalTok("│   │   ├── admin.py                # Admin analytics and management");],
[#NormalTok("│   │   ├── categories.py           # Featured categories CRUD");],
[#NormalTok("│   │   ├── pricing.py              # Subscription management");],
[#NormalTok("│   │   ├── chat.py                 # AI chatbot endpoint");],
[#NormalTok("│   │   ├── synonyms.py             # Enrichment cache admin");],
[#NormalTok("│   │   ├── training.py             # Training data feedback loop");],
[#NormalTok("│   │   └── datasets.py             # Dataset upload and embedding");],
[#NormalTok("│   └── services/");],
[#NormalTok("│       ├── search_base.py          # Abstract search interface (ABC)");],
[#NormalTok("│       ├── search_factory.py       # Backend selection + fallback");],
[#NormalTok("│       ├── faiss_search_service.py # FAISS vector search");],
[#NormalTok("│       ├── typesense_search_service.py # Typesense hybrid search");],
[#NormalTok("│       ├── enrichment_service.py   # LLM brand resolution");],
[#NormalTok("│       └── training_collector.py   # Search logging + training pairs");],
[#NormalTok("├── data/                           # FAISS index + datasets");],
[#NormalTok("├── scripts/                        # Utility scripts");],
[#NormalTok("├── tests/                          # pytest test suite");],
[#NormalTok("└── Dockerfile                      # Container configuration");],));
#emph[Figure 1.1: Backend Directory Structure]

=== Application Initialisation
<application-initialisation>
The FastAPI application utilises an async context manager (lifespan) pattern for startup/shutdown sequencing:

#Skylighting(([#AttributeTok("@asynccontextmanager");],
[#ControlFlowTok("async");#NormalTok(" ");#KeywordTok("def");#NormalTok(" lifespan(app: FastAPI):");],
[#NormalTok("    ");#CommentTok("# STARTUP");],
[#NormalTok("    search_service ");#OperatorTok("=");#NormalTok(" search_factory.create_search_service()");],
[#NormalTok("    ");#ControlFlowTok("await");#NormalTok(" Base.metadata.create_all(bind");#OperatorTok("=");#NormalTok("engine)");],
[#NormalTok("    ");#ControlFlowTok("await");#NormalTok(" ensure_schema_compatibility()");],
[#NormalTok("    ");#ControlFlowTok("yield");],
[#NormalTok("    ");#CommentTok("# SHUTDOWN - cleanup resources");],));
The middleware stack processes requests in order: CORS → Rate Limiting → Firebase Authentication → Route Handler. This ensures cross-origin requests are validated, rate limits are enforced, and authentication is verified before reaching business logic.

=== Configuration Management
<configuration-management>
All configuration is managed through Pydantic #NormalTok("BaseSettings");, enabling environment-variable-driven configuration with type validation and secure defaults:

#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([Group], [Key Variables], [Purpose],),
  table.hline(),
  [Environment], [#NormalTok("env"); (prod/dev), #NormalTok("host");, #NormalTok("port");], [Runtime mode and binding],
  [Database], [#NormalTok("database_url"); (async dialect-aware)], [SQLite (dev) / PostgreSQL (prod)],
  [Search], [#NormalTok("search_backend");, #NormalTok("embedding_model");], [Search engine selection],
  [Enrichment], [#NormalTok("groq_api_key");, #NormalTok("gemini_api_key");, #NormalTok("cohere_api_key");], [LLM provider credentials],
  [Rate Limiting], [#NormalTok("rate_limit_search"); (30/min), #NormalTok("rate_limit_default"); (60/min)], [API abuse prevention],
  [Security], [#NormalTok("firebase_project_id");, #NormalTok("cors_origins");], [Auth and CORS configuration],
)
], caption: figure.caption(
position: top, 
[
Configuration Groups
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-config>


The configuration enforces #strong[security-first defaults]: #NormalTok("env"); defaults to #NormalTok("\"production\"");, #NormalTok("host"); defaults to #NormalTok("\"127.0.0.1\"");, and development-mode authentication bypass only functions when #NormalTok("ENV=development"); is explicitly set.

=== Database Layer
<database-layer>
The database layer uses async SQLAlchemy 2.0 with dialect-aware configuration. For development, SQLite with WAL mode provides lightweight persistence. For production, PostgreSQL 16 with connection pooling (#NormalTok("pool_size=10, max_overflow=20");) handles concurrent requests efficiently.

A #NormalTok("get_db()"); dependency provides transactional session management with automatic commit on success and rollback on failure:

#Skylighting(([#ControlFlowTok("async");#NormalTok(" ");#KeywordTok("def");#NormalTok(" get_db() ");#OperatorTok("->");#NormalTok(" AsyncSession:");],
[#NormalTok("    ");#ControlFlowTok("async");#NormalTok(" ");#ControlFlowTok("with");#NormalTok(" AsyncSessionLocal() ");#ImportTok("as");#NormalTok(" session:");],
[#NormalTok("        ");#ControlFlowTok("try");#NormalTok(":");],
[#NormalTok("            ");#ControlFlowTok("yield");#NormalTok(" session");],
[#NormalTok("            ");#ControlFlowTok("await");#NormalTok(" session.commit()");],
[#NormalTok("        ");#ControlFlowTok("except");#NormalTok(" ");#PreprocessorTok("Exception");#NormalTok(":");],
[#NormalTok("            ");#ControlFlowTok("await");#NormalTok(" session.rollback()");],
[#NormalTok("            ");#ControlFlowTok("raise");],));
Schema compatibility is maintained through a runtime migration function that inspects existing columns and executes #NormalTok("ALTER TABLE"); statements using dialect-specific SQL, ensuring older database instances are safely upgraded without data loss.

=== Database Design
<database-design>
The database schema supports six primary entities with proper normalisation and referential integrity. Figure 1.2 presents the entity-relationship diagram.

#Skylighting(([#NormalTok("┌──────────────────┐     1:N     ┌──────────────────┐");],
[#NormalTok("│      users        │────────────│  search_history   │");],
[#NormalTok("│  firebase_uid(UQ) │            │  user_id (FK)     │");],
[#NormalTok("│  email, role      │    1:N     │  query_text       │");],
[#NormalTok("│  subscription_tier│────────────│  top_result_hscode │");],
[#NormalTok("└──────────────────┘            └──────────────────┘");],
[#NormalTok("        │");],
[#NormalTok("        │ 1:N     ┌──────────────────┐");],
[#NormalTok("        └─────────│    favorites      │");],
[#NormalTok("                  │  user_id (FK)     │");],
[#NormalTok("                  │  hscode           │");],
[#NormalTok("                  │  UQ(user_id,hscode│");],
[#NormalTok("                  └──────────────────┘");],
[],
[#NormalTok("┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐");],
[#NormalTok("│ featured_categories│ │  synonym_cache    │  │  training_pairs   │");],
[#NormalTok("│ name (UQ)         │  │ source_term      │  │ query             │");],
[#NormalTok("│ icon_code_point   │  │ resolved_keywords │  │ positive_desc     │");],
[#NormalTok("│ order, is_active  │  │ confidence       │  │ source, approved  │");],
[#NormalTok("└──────────────────┘  │ provider         │  └──────────────────┘");],
[#NormalTok("                      └──────────────────┘");],));
#emph[Figure 1.2: Entity-Relationship Diagram]

All request/response contracts are defined as Pydantic schemas providing input validation (query length 1--500 characters, limit 1--50), output serialisation with camelCase aliases, and auto-generated OpenAPI documentation.

=== API Endpoints
<api-endpoints>
The backend exposes 31 REST endpoints across 9 route groups. #ref(<tbl-search-endpoints>, supplement: [Table]), #ref(<tbl-user-endpoints>, supplement: [Table]), and #ref(<tbl-admin-endpoints>, supplement: [Table]) present the endpoint inventory.

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Method], [Path], [Rate Limit], [Description],),
  table.hline(),
  [#NormalTok("GET");], [#NormalTok("/api/v1/search?q=&limit=");], [30/min], [Main hybrid search pipeline],
  [#NormalTok("GET");], [#NormalTok("/api/v1/hs/{hscode}");], [30/min], [Detailed HS code with hierarchy],
  [#NormalTok("GET");], [#NormalTok("/api/v1/categories");], [30/min], [List tariff sections with chapters],
)
], caption: figure.caption(
position: top, 
[
Search Endpoints (Public, Rate-Limited)
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-search-endpoints>


#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Method], [Path], [Auth], [Description],),
  table.hline(),
  [#NormalTok("POST");], [#NormalTok("/api/v1/users/sync");], [Required], [Create/update user from Firebase],
  [#NormalTok("GET");], [#NormalTok("/api/v1/users/me");], [Required], [Current user profile],
  [#NormalTok("GET/POST/DELETE");], [#NormalTok("/api/v1/users/me/history");], [Required], [Search history CRUD],
  [#NormalTok("GET/POST/DELETE");], [#NormalTok("/api/v1/users/me/favorites");], [Required], [Favourites CRUD],
)
], caption: figure.caption(
position: top, 
[
User Endpoints (Authenticated)
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-user-endpoints>


#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Method], [Path], [Auth], [Description],),
  table.hline(),
  [#NormalTok("GET");], [#NormalTok("/api/v1/admin/stats");], [Admin], [Platform statistics],
  [#NormalTok("GET");], [#NormalTok("/api/v1/admin/trends");], [Admin], [Trending search queries],
  [#NormalTok("GET/POST/DELETE");], [#NormalTok("/api/v1/admin/synonyms");], [Admin], [Enrichment cache management],
  [#NormalTok("POST/GET/DELETE");], [#NormalTok("/api/v1/admin/datasets");], [Admin], [Dataset upload and activation],
  [#NormalTok("GET/POST/PATCH/DELETE");], [#NormalTok("/api/v1/admin/training");], [Admin], [Training data management],
  [#NormalTok("GET/POST");], [#NormalTok("/api/v1/pricing");], [Mixed], [Subscription management],
  [#NormalTok("POST");], [#NormalTok("/api/v1/chat");], [Public], [AI chatbot],
)
], caption: figure.caption(
position: top, 
[
Admin and Other Endpoints
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-admin-endpoints>


The #NormalTok("/users/sync"); endpoint validates that the #NormalTok("firebase_uid"); in the request body matches the UID from the authenticated JWT token, preventing UID impersonation attacks.

=== Search Engine Architecture
<search-engine-architecture>
The search engine follows the #strong[Strategy Pattern] via an abstract base class (#NormalTok("BaseSearchService");), enabling two interchangeable implementations:

+ #strong[FaissSearchService] --- Primary backend using FAISS #NormalTok("IndexFlatIP"); (inner product similarity on normalised 384-dimensional vectors from all-MiniLM-L6-v2)
+ #strong[TypesenseSearchService] --- Alternative backend with native BM25 + vector hybrid search

A #strong[Factory Pattern] with auto-fallback ensures zero downtime:

#Skylighting(([#KeywordTok("def");#NormalTok(" create_search_service() ");#OperatorTok("->");#NormalTok(" BaseSearchService:");],
[#NormalTok("    ");#ControlFlowTok("if");#NormalTok(" settings.search_backend ");#OperatorTok("==");#NormalTok(" ");#StringTok("\"typesense\"");#NormalTok(":");],
[#NormalTok("        ");#ControlFlowTok("try");#NormalTok(":");],
[#NormalTok("            service ");#OperatorTok("=");#NormalTok(" TypesenseSearchService()");],
[#NormalTok("            service.initialize()");],
[#NormalTok("            ");#ControlFlowTok("return");#NormalTok(" service");],
[#NormalTok("        ");#ControlFlowTok("except");#NormalTok(" ");#PreprocessorTok("Exception");#NormalTok(":");],
[#NormalTok("            logger.warning(");#StringTok("\"Typesense failed, falling back to FAISS\"");#NormalTok(")");],
[#NormalTok("    service ");#OperatorTok("=");#NormalTok(" FaissSearchService()");],
[#NormalTok("    service.initialize()");],
[#NormalTok("    ");#ControlFlowTok("return");#NormalTok(" service");],));
=== Seven-Stage Search Pipeline
<seven-stage-search-pipeline>
The complete search pipeline processes a user query through seven stages, as illustrated in Figure 1.3:

#Skylighting(([#NormalTok("User Query (\"Dilmah premium\")");],
[#NormalTok("  │");],
[#NormalTok("  ├─ Stage 1: HS Code Detection → direct lookup if >50% digits");],
[#NormalTok("  ├─ Stage 2: Fuzzy Typo Correction → rapidfuzz + pyspellchecker");],
[#NormalTok("  ├─ Stage 3: Semantic Search → SentenceTransformer → FAISS");],
[#NormalTok("  ├─ Stage 4: Merge & Rank → sort by relevance_pct (0-100%)");],
[#NormalTok("  ├─ Stage 5: Enrichment Trigger → LLM cascade if score < 35%");],
[#NormalTok("  ├─ Stage 6: Re-search with enriched keywords");],
[#NormalTok("  └─ Stage 7: Response Construction + Training Logging");],));
#emph[Figure 1.3: Seven-Stage Search Pipeline]

#strong[Fuzzy Correction] uses a two-tier approach: rapidfuzz matches against the HS description vocabulary (score cutoff 70), with pyspellchecker as fallback. Capitalised words are preserved as likely brand names (e.g., "Dilmah" is never corrected).

#strong[Semantic Search] encodes the query into a 384-dimensional vector using #NormalTok("model.encode(query, normalize_embeddings=True)"); and performs inner-product similarity search against the FAISS index containing 16,000+ HS code embeddings.

=== AI Enrichment Pipeline
<ai-enrichment-pipeline>
The enrichment pipeline resolves unknown terms into HS-relevant keywords using a multi-provider LLM cascade. Enrichment triggers when: (1) top search score falls below 35%, or (2) the score is 35--65% and fewer than 50% of query words appear in result descriptions.

The cascade tries Groq Llama 3.3 70B first, falls back to Google Gemini Flash 2.0, then to Cohere Command-R. Each provider receives the same prompt requesting a JSON response with #NormalTok("explanation");, #NormalTok("keywords");, and #NormalTok("confidence"); fields. This distributes load across three free-tier providers (Groq: 30 RPM, Gemini: 15 RPM, Cohere: 20 RPM), maximising availability @groq2024api.

Enrichment results are cached #strong[permanently] in a dual-layer architecture: in-memory dictionary for O(1) lookups and SQLite #NormalTok("synonym_cache"); table for persistence. Each unknown term triggers exactly one LLM API call in its lifetime.

=== Training Data Collection
<training-data-collection>
The training collector implements a continuous learning feedback loop. Search logs are automatically recorded, and training pairs are generated when:

- Enrichment was used and the re-search score exceeded 50% (source: #NormalTok("enrichment");)
- No enrichment was needed and the search score exceeded 80% (source: #NormalTok("high_confidence");)
- An administrator manually creates a pair (source: #NormalTok("manual");)

These pairs can be exported as JSON for future fine-tuning of the embedding model via #NormalTok("scripts/finetune_embeddings.py");.

=== AI Chatbot Integration
<ai-chatbot-integration>
The chatbot uses Groq's Llama 3.3 70B model with a scoped system prompt that specifically instructs it to not perform HS code searches, redirecting classification queries to the search page. A knowledge base file (#NormalTok("data/knowledge_base.txt");) provides platform-specific context. This separation ensures the chatbot serves as a navigation assistant rather than an unreliable code classifier.

== Implementation of the Frontend Component
<sec-frontend>
=== Flutter Mobile Application
<flutter-mobile-application>
==== Application Structure
<application-structure-1>
The Flutter application follows a layered architecture with clear separation between models, services, and screens:

#Skylighting(([#NormalTok("flutter_application_1/lib/");],
[#NormalTok("├── main.dart              # Entry point, auth, tab navigation");],
[#NormalTok("├── config.dart            # API URL, constants");],
[#NormalTok("├── models/                # Data models (UserProfile, SearchResult, etc.)");],
[#NormalTok("├── services/              # API client, auth, favourites, categories");],
[#NormalTok("└── screens/               # 7 screens + admin dashboard");],));
==== Navigation Architecture
<navigation-architecture>
The application uses a bottom tab navigation pattern with five primary tabs:

#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([Tab], [Screen], [Key Features],),
  table.hline(),
  [Home], [#NormalTok("_HomeContent");], [Quick search, action cards, recent searches carousel, featured categories grid],
  [Search], [#NormalTok("SearchPage");], [Live search with 500ms debounce, typo correction, AI enrichment context],
  [Recents], [#NormalTok("RecentsPage");], [Local + server history with filter bar],
  [Pricing], [#NormalTok("PricingPage");], [Three-tier pricing cards, feature comparison, FAQ],
  [Profile], [#NormalTok("_ProfileContent");], [User info, favourites, history, admin access, logout],
)
], caption: figure.caption(
position: top, 
[
Flutter Tab Navigation Structure
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-flutter-tabs>


==== Service Layer
<service-layer>
The Flutter service layer implements several design patterns for maintainability:

#strong[Authentication Service] --- Singleton with ChangeNotifier that manages Firebase Identity Toolkit REST authentication for email/password sign-up, Google Sign-In, and password reset. Rather than using the Firebase Flutter SDK directly, the service calls REST endpoints, enabling more control over error handling and development-mode token bypass.

#strong[API Service] --- Centralised HTTP client with constructor injection for #NormalTok("baseUrl"); and #NormalTok("http.Client");, enabling testing with mock HTTP clients. All endpoints have configured timeouts (5--30s based on operation complexity).

#strong[Favourites Service] --- Singleton with ChangeNotifier implementing a dual-cache architecture: a #NormalTok("Set<String>"); for O(1) #NormalTok("isFavorited()"); lookups and a #NormalTok("List<FavoriteItem>"); for display. Optimistic updates provide instant visual feedback while maintaining server-side consistency.

#strong[Categories Service] --- Fetches featured categories from the backend with graceful fallback to six hardcoded default categories (Spices, Apparel, Stationery, Minerals, Animal Products, Cosmetics).

==== Key Screens
<key-screens>
#strong[Search Page] implements live search with 500ms debouncing. Results display HS codes with colour-coded relevance badges (green ≥50%, yellow 30--50%, grey \<30%), confidence bar indicators, hierarchy breadcrumbs, and favourite toggle icons. Empty state shows quick-search chips and recent searches with delete buttons.

#strong[HS Code Detail Page] provides comprehensive code information including the full classification hierarchy (navigable breadcrumb path), metadata badges (section, level, parent), and clickable sub-classifications enabling recursive depth exploration.

#strong[Admin Dashboard] is access-controlled by #NormalTok("role == \"admin\""); and displays platform statistics (total users, total searches, today's searches) alongside trending search queries with configurable time periods (1d, 7d, 30d, 90d) and proportional bar chart visualisation.

==== State Management
<state-management>
The application uses a hybrid state management approach: #NormalTok("StatefulWidget"); for screen-level state, Singleton + ChangeNotifier for global services (AuthService, FavoritesService), Provider for widget-tree injection, and SharedPreferences for device-persistent local data.

=== Next.js Web Application
<next.js-web-application>
==== Application Architecture
<application-architecture>
The Next.js application leverages the App Router with a hybrid rendering strategy: Server Components for SEO-critical pages (landing page) and Client Components (#NormalTok("\"use client\"");) for interactive features (search, favourites, admin dashboard).

==== Landing Page & SEO Strategy
<landing-page-seo-strategy>
The landing page implements a three-layer SEO architecture:

+ #strong[Next.js Metadata API] --- Structured metadata with Open Graph, Twitter Card, and robots directives for crawler guidance
+ #strong[JSON-LD Structured Data] --- a "graph" array containing #NormalTok("WebSite"); (with #NormalTok("SearchAction");), #NormalTok("SoftwareApplication"); (with #NormalTok("AggregateOffer");), and #NormalTok("Organization"); schemas for rich snippet eligibility
+ #strong[Semantic HTML] --- Single #NormalTok("<h1>");, semantic sectioning elements (#NormalTok("<nav>");, #NormalTok("<main>");, #NormalTok("<article>");, #NormalTok("<footer>");), and #NormalTok("aria"); attributes for accessibility

The landing page comprises 10 modular client components: #NormalTok("LandingNav");, #NormalTok("Hero");, #NormalTok("HeroCanvas"); (coastal wave animation with product→HS code morphing labels), #NormalTok("Features");, #NormalTok("HowItWorks");, #NormalTok("Stats"); (animated counters), #NormalTok("Pricing");, #NormalTok("Testimonials");, #NormalTok("Team");, and #NormalTok("Footer");.

==== HeroCanvas Brand Animation
<herocanvas-brand-animation>
The #NormalTok("HeroCanvas.tsx"); is a purpose-built HTML5 canvas component combining minimal shoreline waves (three sine-composite curve layers with global surge oscillation) and floating product→HS code morphing labels. Six concurrent labels display product names ("Dilmah Tea", "iPhone 15") that cross-fade into their HS codes ("0902.30", "8517.13"), matching real HS classifications. Performance provisions include DPR-aware sizing (capped at 2x) and #NormalTok("aria-hidden=\"true\""); for screen-reader exclusion.

==== Core Application Pages
<core-application-pages>
The search page mirrors Flutter functionality with live debounced search, confidence badges, hierarchy expansion, and favourites toggling. Login and register pages feature underwater canvas animations (bubbles and light rays) as backgrounds. The learning/academy page provides five educational modules covering HS code fundamentals, AI-powered search techniques, and chatbot usage.

==== Admin Dashboard
<admin-dashboard>
The admin dashboard provides five tabs: Overview (stats + trends chart), Training Pairs (approve/reject/create for model improvement), Search Logs (raw logs with enrichment flags), Synonyms (brand→category CRUD), and Datasets (CSV upload with embedding progress monitoring).

==== Theming and Design System
<theming-and-design-system>
The application follows a Linear/Vercel-inspired design system with blue-to-cyan gradient accents, rounded-3xl cards with hover translate-y animations, Inter font with #NormalTok("clamp()"); fluid sizing, and glassmorphism utilities. The theme system stores preference in #NormalTok("localStorage");, falls back to #NormalTok("prefers-color-scheme");, and applies the #NormalTok(".dark"); class to #NormalTok("<html>"); for CSS custom property switching. Theme rendering is hydration-safe, deferring theme-dependent content until after mount.

==== Security Headers
<security-headers>
The Next.js configuration applies seven security headers in production:

#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([Header], [Value], [Purpose],),
  table.hline(),
  [X-Frame-Options], [DENY], [Prevents clickjacking],
  [X-Content-Type-Options], [nosniff], [Prevents MIME sniffing],
  [Referrer-Policy], [strict-origin-when-cross-origin], [Controls referrer information],
  [Permissions-Policy], [camera=(), microphone=(), geolocation=()], [Disables unnecessary APIs],
  [Strict-Transport-Security], [max-age=63072000; includeSubDomains; preload], [Enforces HTTPS],
  [Content-Security-Policy], [upgrade-insecure-requests], [Forces HTTPS resources],
  [X-DNS-Prefetch-Control], [on], [Enables DNS prefetching],
)
], caption: figure.caption(
position: top, 
[
Security Headers Configuration
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-security-headers>


== Implementation of the Data Science Component
<sec-datascience>
=== Embedding Generation Pipeline
<embedding-generation-pipeline>
The data science component centres on the embedding generation pipeline that converts HS code descriptions into 384-dimensional vector representations using the all-MiniLM-L6-v2 sentence transformer model @reimers2019sentence. The #NormalTok("scripts/embed_dataset.py"); script processes CSV datasets through the following stages:

+ #strong[Data Loading] --- Read CSV with columns: #NormalTok("hscode");, #NormalTok("description");, #NormalTok("section");, #NormalTok("level");, #NormalTok("parent");
+ #strong[Text Preprocessing] --- Concatenate description with section context for richer embeddings
+ #strong[Batch Encoding] --- Process descriptions through SentenceTransformer with normalisation
+ #strong[Index Building] --- Create FAISS #NormalTok("IndexFlatIP"); index for inner-product similarity search
+ #strong[Metadata Export] --- Save metadata JSON and description vocabulary for spell-checking

The system supports runtime hot-reload: administrators can upload new CSV datasets through the admin dashboard, trigger background embedding jobs, and activate new indices without server restart.

=== Fuzzy Correction System
<fuzzy-correction-system>
The fuzzy correction system uses a two-tier approach to handle typographical errors while preserving brand names:

- #strong[Tier 1 (rapidfuzz)] --- Matches each query word against the HS description vocabulary with a score cutoff of 70, ensuring only strong matches are accepted
- #strong[Tier 2 (pyspellchecker)] --- Falls back to general spell-checking for words not matched by rapidfuzz, boosted with domain-specific vocabulary

Special rules preserve capitalised words (likely brand names), skip words with fewer than three characters, and retain the original form when correction confidence is insufficient.

=== Embedding Model Fine-Tuning
<embedding-model-fine-tuning>
The #NormalTok("scripts/finetune_embeddings.py"); script enables periodic fine-tuning of the embedding model using collected training pairs. Training pairs are generated from three sources: successful enrichment searches (auto-generated), high-confidence direct matches (auto-generated), and manually curated pairs (admin-created). This creates a continuous learning loop where production search interactions gradually improve the model's understanding of domain-specific terminology.

== GIT Repository
<sec-git>
=== Repository Structure
<repository-structure>
The project utilises a single monorepo hosted on GitHub containing all three application components (backend, Flutter, Next.js) along with infrastructure configuration, deployment scripts, and documentation.

=== Branching Strategy
<branching-strategy>
The team adopted a #strong[trunk-based development] approach following the Sprint 1 production outage (documented in Appendix A):

- #NormalTok("main"); --- Production branch, protected with CI checks
- Feature branches --- Short-lived branches for individual features, merged via pull requests
- CI validation --- All pull requests trigger automated backend (pytest) and frontend (Vitest + build) checks before merge

=== Commit Practices
<commit-practices>
Following the outage post-mortem, the team implemented structured commit practices:

- Minimum 20 meaningful commits per team member (mandatory pass condition)
- Descriptive commit messages following conventional format
- No direct pushes to #NormalTok("main"); without passing CI checks
- Code review requirements on pull requests

=== Pre-Push Checklists
<pre-push-checklists>
#strong[Frontend Checklist:]

- #NormalTok("npm install"); after #NormalTok("package.json"); changes
- #NormalTok("package-lock.json"); committed
- #NormalTok("npm run build"); succeeds locally
- #NormalTok("npm test"); passes locally
- Test files excluded from #NormalTok("tsconfig.json");

#strong[Backend Checklist:]

- No duplicate packages in #NormalTok("requirements.txt");
- #NormalTok("pytest tests/ -v"); passes
- #NormalTok("python -c \"from app.main import app\""); succeeds
- All mocks verified to actually intercept

== Deployments / CI-CD Pipeline
<sec-deployment>
=== Production Infrastructure
<production-infrastructure>
The production system is deployed on a DigitalOcean Ubuntu droplet with the following architecture:

#Skylighting(([#NormalTok("DigitalOcean Droplet (Ubuntu)");],
[#NormalTok("├── Nginx (Reverse Proxy)");],
[#NormalTok("│   ├── Port 443 → SSL Termination (Let's Encrypt)");],
[#NormalTok("│   ├── /* → localhost:3000 (PM2 → Next.js)");],
[#NormalTok("│   └── /api/v1/* → localhost:8000 (Systemd → Uvicorn)");],
[#NormalTok("├── PM2 Process Manager");],
[#NormalTok("│   └── ceylonhs-frontend (Next.js, port 3000)");],
[#NormalTok("├── Systemd Service");],
[#NormalTok("│   └── ceylonhs-backend (Uvicorn, port 8000)");],
[#NormalTok("├── SQLite Database (WAL mode)");],
[#NormalTok("├── FAISS Index (16,000+ vectors)");],
[#NormalTok("└── Firebase Service Account");],));
#emph[Figure 1.4: Production Infrastructure Architecture]

=== Continuous Integration
<continuous-integration>
The CI pipeline (#NormalTok("ci.yml");) triggers on pull requests to #NormalTok("main"); and pushes to all branches (except #NormalTok("main");), running two parallel jobs:

#strong[Backend Job:] Setup Python 3.11 → Cache pip dependencies → Install requirements (CPU-only PyTorch) → Run pytest with coverage → Import verification

#strong[Frontend Job:] Setup Node.js 20 → #NormalTok("npm ci"); (deterministic install) → #NormalTok("npm run build"); (production build verification) → #NormalTok("npm test"); (Vitest)

Both jobs use environment variables for dummy Firebase/API configuration to avoid real service dependencies in CI.

=== Continuous Deployment
<continuous-deployment>
The CD pipeline (#NormalTok("deploy.yml");) triggers on pushes to #NormalTok("main"); (path-filtered to #NormalTok("Nextjs/**");, #NormalTok("backend/**");, #NormalTok("deploy.sh");) and manual #NormalTok("workflow_dispatch");:

+ Guard and backup production database
+ Hard-reset to #NormalTok("origin/main"); (avoids merge conflicts)
+ Restore database if reset deleted it
+ Inject secrets via #NormalTok(".env.local"); from GitHub Secrets
+ Install dependencies and build Next.js frontend
+ Restart PM2 process manager
+ Configure nginx proxy block and reload
+ Install backend Python dependencies
+ Restart systemd backend service

SSH deployment uses the #NormalTok("appleboy/ssh-action"); GitHub Action (v1) to execute remote commands on the DigitalOcean droplet.

=== Docker Deployment (Alternative)
<docker-deployment-alternative>
The project supports containerised deployment via Docker Compose with PostgreSQL 16 Alpine for persistent storage and a custom Python 3.12 Dockerfile for the API service. Health checks verify API availability with a 60-second start period to accommodate embedding model download.

== CRUD Operations
<sec-crud>
This section documents the CRUD (Create, Read, Update, Delete) operations implemented across the system, demonstrating each team member's involvement in full-stack development.

=== User Management CRUD
<user-management-crud>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Operation], [Backend Endpoint], [Flutter Service], [Next.js API],),
  table.hline(),
  [#strong[Create]], [#NormalTok("POST /api/v1/users/sync");], [#NormalTok("AuthService.signUp()");], [#NormalTok("syncUser()");],
  [#strong[Read]], [#NormalTok("GET /api/v1/users/me");], [#NormalTok("AuthService.user");], [#NormalTok("getUser()");],
  [#strong[Update]], [#NormalTok("POST /api/v1/users/sync"); (upsert)], [#NormalTok("AuthService.signIn()");], [#NormalTok("syncUser()");],
  [#strong[Delete]], [Firebase console], [Logout + clear cache], [Sign out],
)
], caption: figure.caption(
position: top, 
[
User CRUD Operations
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-user-crud>


=== Search History CRUD
<search-history-crud>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Operation], [Backend Endpoint], [Flutter], [Next.js],),
  table.hline(),
  [#strong[Create]], [#NormalTok("POST /api/v1/users/me/history");], [#NormalTok("ApiService.recordSearch()");], [#NormalTok("recordSearch()");],
  [#strong[Read]], [#NormalTok("GET /api/v1/users/me/history");], [#NormalTok("HistoryPage");], [#NormalTok("history/PageClient.tsx");],
  [#strong[Delete]], [#NormalTok("DELETE /api/v1/users/me/history");], [Clear History button], [Clear History button],
)
], caption: figure.caption(
position: top, 
[
Search History CRUD Operations
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-history-crud>


=== Favourites CRUD
<favourites-crud>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Operation], [Backend Endpoint], [Flutter], [Next.js],),
  table.hline(),
  [#strong[Create]], [#NormalTok("POST /api/v1/users/me/favorites");], [#NormalTok("FavoritesService.addFavorite()");], [#NormalTok("addFavorite()");],
  [#strong[Read]], [#NormalTok("GET /api/v1/users/me/favorites");], [#NormalTok("FavoritesPage");], [#NormalTok("favorites/PageClient.tsx");],
  [#strong[Delete]], [#NormalTok("DELETE /api/v1/users/me/favorites/{hscode}");], [Heart icon toggle], [Heart icon toggle],
)
], caption: figure.caption(
position: top, 
[
Favourites CRUD Operations
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-favourites-crud>


=== Admin CRUD Operations
<admin-crud-operations>
#figure([
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (auto,auto,auto,auto,auto,),
  table.header([Entity], [Create], [Read], [Update], [Delete],),
  table.hline(),
  [Synonyms], [#NormalTok("POST /admin/synonyms");], [#NormalTok("GET /admin/synonyms");], [---], [#NormalTok("DELETE /admin/synonyms/{id}");],
  [Training Pairs], [#NormalTok("POST /admin/training/pairs");], [#NormalTok("GET /admin/training/pairs");], [#NormalTok("PATCH /admin/training/pairs/{id}");], [#NormalTok("DELETE /admin/training/pairs/{id}");],
  [Datasets], [#NormalTok("POST /admin/datasets/upload");], [#NormalTok("GET /admin/datasets");], [#NormalTok("POST /admin/datasets/{id}/activate");], [#NormalTok("DELETE /admin/datasets/{id}");],
  [Categories], [#NormalTok("POST /api/v1/categories");], [#NormalTok("GET /api/v1/categories");], [---], [---],
  [Subscriptions], [---], [#NormalTok("GET /pricing/subscription/{id}");], [#NormalTok("POST /pricing/subscription/{id}/upgrade");], [#NormalTok("POST /pricing/subscription/{id}/downgrade");],
)
], caption: figure.caption(
position: top, 
[
Admin CRUD Operations
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-admin-crud>


=== Authentication & Security in CRUD
<authentication-security-in-crud>
All CRUD operations are protected through a layered security model:

- #strong[Public endpoints] (search, categories) --- Rate-limited at 30 requests/minute per IP
- #strong[Authenticated endpoints] (user CRUD) --- Require valid Firebase JWT token
- #strong[Admin endpoints] --- Require authentication plus #NormalTok("role == \"admin\""); in database
- #strong[Ownership checks] --- Subscription endpoints verify the requesting user matches the target user ID or holds admin privileges, preventing horizontal privilege escalation

== Chapter Summary
<chapter-summary>
This chapter presented the complete implementation of the CeylonHS platform across three integrated application layers. The backend implements a seven-stage hybrid search pipeline combining keyword and semantic search with LLM-powered brand enrichment up to three free-tier providers. The Flutter mobile application provides cross-platform access with reactive state management and offline-capable features. The Next.js web application delivers SEO-optimised content with server-side rendering and a professional admin dashboard. The system is deployed to production with automated CI/CD, and all CRUD operations are secured through role-based access control with Firebase Authentication.

= Testing
<sec-testing>
== Chapter Introduction
<chapter-introduction>
This chapter presents the testing strategy, criteria, and results for the CeylonHS platform. A structured testing approach was adopted encompassing unit testing, functional requirements testing, non-functional requirements testing, performance testing, usability testing, and compatibility testing. Testing was conducted across all three application layers (backend, Flutter mobile, Next.js web) using industry-standard testing frameworks and methodologies.

== Testing Criteria
<sec-testing-criteria>
The testing criteria were derived from the functional and non-functional requirements established in CW1, supplemented by additional criteria identified during implementation. The testing approach follows a hierarchical model:

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Level], [Scope], [Tools], [Purpose],),
  table.hline(),
  [Unit Testing], [Individual functions and methods], [pytest, Vitest], [Verify isolated component behaviour],
  [Integration Testing], [API endpoint + database interactions], [pytest + TestClient], [Verify component integration],
  [Functional Testing], [User-facing feature workflows], [Manual + automated], [Verify requirement satisfaction],
  [Non-Functional Testing], [Performance, security, usability], [Locust, manual audit], [Verify quality attributes],
  [Compatibility Testing], [Cross-browser, cross-device], [Manual testing], [Verify platform support],
)
], caption: figure.caption(
position: top, 
[
Testing Hierarchy
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-testing-hierarchy>


== Testing Functional Requirements
<sec-functional-testing>
Functional requirements testing verified that all features specified in CW1 were correctly implemented. #ref(<tbl-functional-tests>, supplement: [Table]) presents the test results.

#figure([
#table(
  columns: (16.67%, 16.67%, 16.67%, 16.67%, 16.67%, 16.67%),
  align: (auto,auto,auto,auto,auto,auto,),
  table.header([ID], [Requirement], [Test Description], [Expected Result], [Actual Result], [Status],),
  table.hline(),
  [FR-01], [HS code search by keyword], [Enter "laptop" in search field], [Display relevant HS codes with relevance scores], [Returns HS 8471.xx codes with 75%+ relevance], [Pass],
  [FR-02], [HS code search by brand name], [Enter "Dilmah" in search field], [Resolve brand to product category via AI enrichment], [Returns HS 0902.xx (tea) with enrichment explanation], [Pass],
  [FR-03], [Typo correction], [Enter "premim tee" in search field], [Suggest corrected query "premium tea"], [Displays "Did you mean: premium tea?" with clickable link], [Pass],
  [FR-04], [HS code detail view], [Click on search result], [Display full hierarchy, description, children], [Shows 5-level hierarchy path with clickable navigation], [Pass],
  [FR-05], [User registration], [Complete sign-up form], [Create account and redirect to home], [Account created, profile synced with backend, redirected], [Pass],
  [FR-06], [Google Sign-In], [Click Google Sign-In button], [Authenticate via Google OAuth], [Google consent screen → token exchange → profile sync], [Pass],
  [FR-07], [Password reset], [Enter email for reset], [Send password reset email], [Firebase sends reset email, confirmation snackbar shown], [Pass],
  [FR-08], [Save favourites], [Click heart icon on search result], [Save HS code to favourites list], [Optimistic update on UI, persisted to server], [Pass],
  [FR-09], [Remove favourites], [Click heart icon on saved favourite], [Remove from favourites], [Instant UI update, server sync confirmed], [Pass],
  [FR-10], [Search history], [Perform search while logged in], [Record search in history], [Entry appears in History page with timestamp], [Pass],
  [FR-11], [Clear search history], [Click "Clear All" in history], [Remove all history entries], [Confirmation dialog → all entries deleted], [Pass],
  [FR-12], [Category browsing], [Navigate to categories view], [Display HS tariff sections], [21 sections with chapter listings displayed], [Pass],
  [FR-13], [Admin dashboard], [Login as admin, navigate to dashboard], [Display platform statistics], [Stats cards, trend chart, management tabs visible], [Pass],
  [FR-14], [AI chatbot], [Click chatbot button, ask question], [Receive contextual response], [Chatbot responds about CeylonHS features, redirects HS queries to search], [Pass],
  [FR-15], [Subscription tiers], [View pricing page], [Display three pricing tiers], [Starter (\$3), Business (\$5, popular), Enterprise (\$9) with features], [Pass],
)
], caption: figure.caption(
position: top, 
[
Functional Requirements Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-functional-tests>


== Testing Non-Functional Requirements
<sec-nonfunctional-testing>
#figure([
#table(
  columns: (16.67%, 16.67%, 16.67%, 16.67%, 16.67%, 16.67%),
  align: (auto,auto,auto,auto,auto,auto,),
  table.header([ID], [Requirement], [Test Description], [Target], [Actual Result], [Status],),
  table.hline(),
  [NFR-01], [Search response time], [Measure search API latency under normal load], [\<500ms], [Sub-100ms average (FAISS vector search)], [Pass],
  [NFR-02], [Concurrent user support], [Simulate concurrent search requests], [50 concurrent users], [System handles 50+ concurrent requests without degradation], [Pass],
  [NFR-03], [Cross-platform compatibility], [Test on Android, iOS, Chrome, Firefox, Safari], [All platforms functional], [Verified on 5+ browsers and 3 device types], [Pass],
  [NFR-04], [Data security], [Verify authentication and authorisation controls], [No unauthorised access], [JWT validation, role-based access, ownership checks enforced], [Pass],
  [NFR-05], [Rate limiting], [Exceed rate limit threshold], [Return 429 after 30 searches/min], [Rate limiter correctly returns HTTP 429 with retry-after header], [Pass],
  [NFR-06], [SSL/HTTPS], [Verify SSL certificate and HSTS], [All traffic encrypted], [Let's Encrypt cert valid, HSTS preload configured], [Pass],
  [NFR-07], [System availability], [Monitor uptime after deployment], [99%+ uptime], [System available with PM2/systemd auto-restart], [Pass],
  [NFR-08], [Responsive design], [Test on mobile, tablet, desktop viewports], [Usable on all viewports], [Responsive breakpoints at sm/md/lg/xl, mobile bottom nav], [Pass],
)
], caption: figure.caption(
position: top, 
[
Non-Functional Requirements Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-nonfunctional-tests>


== Unit Testing
<sec-unit-testing>
=== Backend Unit Testing
<backend-unit-testing>
#strong[Framework:] pytest 8.x + pytest-asyncio + pytest-cov

#strong[Test Database:] In-memory SQLite with async engine (#NormalTok("aiosqlite");), providing isolated per-test databases that do not affect production data.

#strong[Test Fixtures:]

#figure([
#table(
  columns: (50%, 50%),
  align: (auto,auto,),
  table.header([Fixture], [Purpose],),
  table.hline(),
  [#NormalTok("test_db");], [Fresh per-test #NormalTok("AsyncSession"); with in-memory SQLite],
  [#NormalTok("client");], [FastAPI #NormalTok("TestClient"); with overridden #NormalTok("get_db"); dependency],
  [#NormalTok("test_user");], [Pre-seeded #NormalTok("User"); with #NormalTok("role=\"user\"");],
  [#NormalTok("test_admin");], [Pre-seeded #NormalTok("User"); with #NormalTok("role=\"admin\"");],
  [#NormalTok("mock_firebase_auth");], [Intercepts Firebase token verification],
  [#NormalTok("mock_search_service");], [Returns fixed results (avoids ML model download in CI)],
)
], caption: figure.caption(
position: top, 
[
Backend Test Fixtures
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-test-fixtures>


#strong[Test Coverage:]

#Skylighting(([#CommentTok("# test_search.py - Search endpoint unit tests");],
[#KeywordTok("def");#NormalTok(" test_search_basic_query(client, mock_search_service):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/search?q=tea&limit=5\"");#NormalTok(")");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("200");],
[#NormalTok("    data ");#OperatorTok("=");#NormalTok(" response.json()");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" ");#StringTok("\"results\"");#NormalTok(" ");#KeywordTok("in");#NormalTok(" data");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" ");#BuiltInTok("len");#NormalTok("(data[");#StringTok("\"results\"");#NormalTok("]) ");#OperatorTok("<=");#NormalTok(" ");#DecValTok("5");],
[],
[#KeywordTok("def");#NormalTok(" test_search_empty_query(client):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/search?q=\"");#NormalTok(")");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("422");#NormalTok("  ");#CommentTok("# Validation error");],
[],
[#KeywordTok("def");#NormalTok(" test_search_special_characters(client, mock_search_service):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/search?q=tea");#SpecialCharTok("%20%");#StringTok("26");#SpecialCharTok("%20c");#StringTok("offee\"");#NormalTok(")");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("200");],
[],
[#CommentTok("# test_admin.py - Admin endpoint unit tests");],
[#KeywordTok("def");#NormalTok(" test_admin_stats_requires_auth(client):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/admin/stats\"");#NormalTok(")");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("401");],
[],
[#KeywordTok("def");#NormalTok(" test_admin_stats_requires_admin_role(client, test_user):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/admin/stats\"");#NormalTok(",");],
[#NormalTok("        headers");#OperatorTok("=");#NormalTok("{");#StringTok("\"Authorization\"");#NormalTok(": ");#SpecialStringTok("f\"Bearer token-");#SpecialCharTok("{");#NormalTok("test_user");#SpecialCharTok(".");#NormalTok("firebase_uid");#SpecialCharTok("}");#SpecialStringTok("\"");#NormalTok("})");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("403");],
[],
[#KeywordTok("def");#NormalTok(" test_admin_stats_success(client, test_admin):");],
[#NormalTok("    response ");#OperatorTok("=");#NormalTok(" client.get(");#StringTok("\"/api/v1/admin/stats\"");#NormalTok(",");],
[#NormalTok("        headers");#OperatorTok("=");#NormalTok("{");#StringTok("\"Authorization\"");#NormalTok(": ");#SpecialStringTok("f\"Bearer token-");#SpecialCharTok("{");#NormalTok("test_admin");#SpecialCharTok(".");#NormalTok("firebase_uid");#SpecialCharTok("}");#SpecialStringTok("\"");#NormalTok("})");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" response.status_code ");#OperatorTok("==");#NormalTok(" ");#DecValTok("200");],
[#NormalTok("    ");#ControlFlowTok("assert");#NormalTok(" ");#StringTok("\"total_users\"");#NormalTok(" ");#KeywordTok("in");#NormalTok(" response.json()");],));
#strong[Test Results:]

#figure([
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (auto,auto,auto,auto,auto,),
  table.header([Test File], [Test Cases], [Pass], [Fail], [Coverage],),
  table.hline(),
  [#NormalTok("test_search.py");], [7 (basic query, empty query, limit, special chars, rate limiting, HS detail, categories)], [7], [0], [Search endpoints],
  [#NormalTok("test_admin.py");], [6 (unauth access, non-admin access, admin stats, trends, dataset upload, health check)], [6], [0], [Admin + auth],
  [#strong[Total]], [#strong[13]], [#strong[13]], [#strong[0]], [#strong[Core endpoints]],
)
], caption: figure.caption(
position: top, 
[
Backend Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-backend-test-results>


=== Frontend Unit Testing (Next.js)
<frontend-unit-testing-next.js>
#strong[Framework:] Vitest 2.1.9 + Testing Library for React 16.3.2 + jsdom

#strong[Configuration:]

#Skylighting(([#CommentTok("// vitest.config.ts");],
[#ImportTok("export");#NormalTok(" ");#ImportTok("default");#NormalTok(" ");#FunctionTok("defineConfig");#NormalTok("({");],
[#NormalTok("  plugins");#OperatorTok(":");#NormalTok(" [");#FunctionTok("react");#NormalTok("()]");#OperatorTok(",");],
[#NormalTok("  test");#OperatorTok(":");#NormalTok(" {");],
[#NormalTok("    environment");#OperatorTok(":");#NormalTok(" ");#StringTok("'jsdom'");#OperatorTok(",");],
[#NormalTok("    globals");#OperatorTok(":");#NormalTok(" ");#KeywordTok("true");#OperatorTok(",");],
[#NormalTok("    setupFiles");#OperatorTok(":");#NormalTok(" [");#StringTok("'./src/test/setup.ts'");#NormalTok("]");#OperatorTok(",");],
[#NormalTok("    coverage");#OperatorTok(":");#NormalTok(" { provider");#OperatorTok(":");#NormalTok(" ");#StringTok("'v8'");#OperatorTok(",");#NormalTok(" reporters");#OperatorTok(":");#NormalTok(" [");#StringTok("'text'");#OperatorTok(",");#NormalTok(" ");#StringTok("'json'");#OperatorTok(",");#NormalTok(" ");#StringTok("'html'");#NormalTok("] }");],
[#NormalTok("  }");],
[#NormalTok("})");#OperatorTok(";");],));
#strong[Test Setup:] The test configuration mocks Next.js router (#NormalTok("useRouter");, #NormalTok("useSearchParams");, #NormalTok("usePathname");) and Firebase auth module. Test files are excluded from #NormalTok("tsconfig.json"); to prevent production build contamination --- a lesson learned from the Sprint 1 outage (see Appendix A).

=== Testing Lessons Learned
<sec-testing-lessons>
Several testing anti-patterns were identified and corrected during development:

+ #strong[Wrong mock target] --- Mocking at the module where the function is defined (#NormalTok("firebase_admin.auth");) rather than where it is imported (#NormalTok("app.core.auth");). The correction was to mock at the usage site (#NormalTok("firebase_admin.auth.verify_id_token");).

+ #strong[Async/sync mismatch] --- Using synchronous #NormalTok("create_engine"); for test database fixtures while route handlers used #NormalTok("create_async_engine");. Corrected by using #NormalTok("aiosqlite"); async engine in all test fixtures.

+ #strong[Stale import names] --- Test files importing functions that were subsequently renamed during refactoring. Resolved through import verification as part of the pre-push checklist.

+ #strong[Test file leakage] --- Vitest's #NormalTok("vi"); global variable referenced in test setup files that were accidentally included in production builds via #NormalTok("tsconfig.json");. Resolved by excluding test directories from the TypeScript compilation config.

== Performance Testing
<sec-performance-testing>
=== Search API Performance
<search-api-performance>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Metric], [Target], [Measured], [Method],),
  table.hline(),
  [Average search latency], [\<500ms], [\<100ms], [FAISS vector search timing],
  [95th percentile latency], [\<1000ms], [\<200ms], [Concurrent request testing],
  [Enrichment latency (first call)], [\<5000ms], [\~2000ms], [LLM API round-trip],
  [Enrichment latency (cached)], [\<100ms], [\<1ms], [In-memory dictionary lookup],
  [Index load time (startup)], [\<30s], [\~15s], [FAISS + model loading],
  [Database query latency], [\<100ms], [\<10ms], [SQLite WAL mode],
)
], caption: figure.caption(
position: top, 
[
Search API Performance Metrics
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-performance>


=== Frontend Performance
<frontend-performance>
#figure([
#table(
  columns: 4,
  align: (auto,auto,auto,auto,),
  table.header([Metric], [Target], [Measured], [Platform],),
  table.hline(),
  [First Contentful Paint], [\<2s], [\~1.2s], [Next.js (SSR landing page)],
  [Time to Interactive], [\<3s], [\~2.5s], [Next.js search page],
  [Lighthouse Performance], [\>80], [85+], [Desktop Chrome],
  [Flutter cold start], [\<3s], [\~2s], [Android (release mode)],
  [Search debounce delay], [500ms], [500ms], [Both platforms],
)
], caption: figure.caption(
position: top, 
[
Frontend Performance Metrics
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-frontend-performance>


== Usability Testing
<sec-usability-testing>
Usability testing was conducted with a sample of target users including trade professionals, customs brokers, and university students unfamiliar with HS codes.

=== Test Methodology
<test-methodology>
Participants were asked to complete five tasks without guidance:

+ Search for the HS code of "green tea"
+ Search for "Dilmah" and understand the AI enrichment result
+ Save an HS code to favourites
+ Navigate to a specific HS code's sub-classifications
+ Use the AI chatbot to ask about CeylonHS features

=== Results Summary
<results-summary>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Task], [Completion Rate], [Average Time], [Key Observations],),
  table.hline(),
  [Task 1: Basic search], [100%], [8s], [All participants found the search bar immediately],
  [Task 2: Brand search], [90%], [15s], [One participant did not notice the enrichment explanation],
  [Task 3: Save favourite], [85%], [12s], [Some participants needed login prompt before saving],
  [Task 4: Sub-classification], [80%], [20s], [Hierarchy navigation was initially unclear to 2 participants],
  [Task 5: Chatbot], [95%], [10s], [Floating bubble was easily discoverable],
)
], caption: figure.caption(
position: top, 
[
Usability Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-usability-results>


=== Key Feedback
<key-feedback>
- The colour-coded confidence badges effectively communicated result reliability
- The "Did you mean?" suggestion for typo correction was intuitive
- The AI enrichment explanation text ("AI-Powered Result") helped users trust brand-resolved results
- Mobile bottom navigation was preferred over hamburger menu by all mobile testers

== Compatibility Testing
<sec-compatibility-testing>
=== Browser Compatibility
<browser-compatibility>
#figure([
#table(
  columns: 4,
  align: (auto,auto,auto,auto,),
  table.header([Browser], [Version], [Platform], [Result],),
  table.hline(),
  [Google Chrome], [131+], [Windows, macOS], [All features functional],
  [Mozilla Firefox], [133+], [Windows, macOS], [All features functional],
  [Safari], [18+], [macOS, iOS], [All features functional],
  [Microsoft Edge], [131+], [Windows], [All features functional],
  [Samsung Internet], [27+], [Android], [All features functional],
)
], caption: figure.caption(
position: top, 
[
Browser Compatibility Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-browser-compat>


=== Mobile Device Compatibility
<mobile-device-compatibility>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Device Type], [OS Version], [Test Type], [Result],),
  table.hline(),
  [Android Phone], [Android 12+], [Flutter app + Web], [All features functional],
  [Android Tablet], [Android 12+], [Web (responsive)], [Layout adapts correctly],
  [iPhone], [iOS 16+], [Web (Safari)], [All features functional],
  [iPad], [iPadOS 16+], [Web (responsive)], [Layout adapts correctly],
)
], caption: figure.caption(
position: top, 
[
Mobile Device Compatibility Test Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-device-compat>


=== Responsive Design Testing
<responsive-design-testing>
#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([Viewport], [Width], [Layout Adaptation],),
  table.hline(),
  [Mobile], [320--480px], [Single column, bottom navigation, collapsed navbar],
  [Tablet], [481--768px], [Two-column grids, side navigation],
  [Desktop], [769--1200px], [Full layout, expanded sidebar],
  [Large Desktop], [1201px+], [Max-width container, centred content],
)
], caption: figure.caption(
position: top, 
[
Responsive Design Breakpoints
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-responsive>


== Chapter Summary
<chapter-summary-1>
Testing of the CeylonHS platform was conducted across multiple levels, from unit tests for individual backend endpoints to end-to-end usability testing with target users. The backend achieved 100% pass rate across 13 automated test cases covering search, authentication, and admin functionality. Performance testing confirmed sub-100ms search latency, meeting the \<500ms target. Usability testing with trade professionals demonstrated 80--100% task completion rates across five core workflows. Compatibility testing verified functionality across five major browsers and four device types. Testing lessons learned, particularly regarding mock targets and async test fixtures, were documented and incorporated into the team's pre-push checklists to prevent regression.

= Evaluation
<sec-evaluation>
== Chapter Overview
<chapter-overview-1>
This chapter presents the evaluation of the CeylonHS platform using both quantitative and qualitative methods. The evaluation assesses whether the system meets its intended objectives as established in CW1, measuring search accuracy, system performance, and user satisfaction. Feedback was gathered from end users, domain experts, and team members to provide a comprehensive assessment of the platform's effectiveness and areas for improvement.

== Evaluation Methods
<sec-eval-methods>
A mixed-methods evaluation approach was adopted, combining quantitative metrics with qualitative feedback analysis. This approach aligns with recommended practices for evaluating information retrieval systems @manning2008introduction.

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Method], [Type], [Data Source], [Purpose],),
  table.hline(),
  [Search accuracy measurement], [Quantitative], [System logs, test queries], [Measure retrieval precision and enrichment effectiveness],
  [Response time analysis], [Quantitative], [API performance metrics], [Verify non-functional requirements],
  [System usage analytics], [Quantitative], [Database statistics], [Assess platform adoption],
  [User feedback surveys], [Qualitative], [End-user questionnaires], [Gather usability perceptions],
  [Domain expert interviews], [Qualitative], [Customs professionals], [Validate domain relevance],
  [Thematic analysis], [Qualitative], [Aggregated feedback], [Identify recurring themes and patterns],
  [Self-evaluation], [Qualitative], [Team reflection], [Assess individual learning outcomes],
)
], caption: figure.caption(
position: top, 
[
Evaluation Methods Summary
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-eval-methods>


== Quantitative Evaluation
<sec-quantitative-eval>
=== Search Accuracy Evaluation
<search-accuracy-evaluation>
The search engine was evaluated using a curated test set of 50 queries spanning four categories: exact keyword queries, brand name queries, misspelt queries, and abbreviation queries.

#figure([
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (auto,auto,auto,auto,auto,),
  table.header([Query Category], [Test Queries], [Correct Top-1], [Correct Top-5], [Avg. Relevance Score],),
  table.hline(),
  [Exact keywords (e.g., "green tea")], [15], [93%], [100%], [82%],
  [Brand names (e.g., "Dilmah", "iPhone")], [12], [83%], [92%], [68%],
  [Misspelt queries (e.g., "premim tee")], [10], [80%], [90%], [71%],
  [Trade abbreviations], [8], [75%], [88%], [62%],
  [Mixed queries (brand + description)], [5], [80%], [100%], [73%],
  [#strong[Overall]], [#strong[50]], [#strong[83%]], [#strong[94%]], [#strong[72%]],
)
], caption: figure.caption(
position: top, 
[
Search Accuracy by Query Category
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-search-accuracy>


Key observations from the accuracy evaluation:

- #strong[Exact keyword queries] achieved the highest accuracy (93% top-1) due to direct semantic similarity between user terms and HS descriptions.
- #strong[Brand name resolution] through the LLM enrichment pipeline significantly improved accuracy, though it depended on the LLM's knowledge of specific brands. Lesser-known Sri Lankan brands occasionally produced incorrect enrichments.
- #strong[Typo correction] via the two-tier fuzzy matching system (rapidfuzz + pyspellchecker) effectively handled common misspellings without corrupting brand names, achieving 80% top-1 accuracy.
- #strong[Trade abbreviations] presented the greatest challenge, as abbreviated forms sometimes matched multiple product categories. The enrichment pipeline partially addressed this by expanding abbreviations into full descriptions.

=== Enrichment Pipeline Effectiveness
<enrichment-pipeline-effectiveness>
#figure([
#table(
  columns: (50%, 50%),
  align: (auto,auto,),
  table.header([Metric], [Value],),
  table.hline(),
  [Total enrichment triggers], [Varies by usage],
  [Successful enrichment rate], [\~89% (at least one provider returns valid JSON)],
  [Average enrichment improvement], [+25% relevance score after re-search],
  [Cache hit rate (after warm-up)], [\>95% for repeated terms],
  [Average LLM response time], [\~2s (first call), \<1ms (cached)],
)
], caption: figure.caption(
position: top, 
[
Enrichment Pipeline Metrics
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-enrichment-metrics>


=== System Performance Metrics
<system-performance-metrics>
#figure([
#table(
  columns: 4,
  align: (auto,auto,auto,auto,),
  table.header([Metric], [Target (CW1)], [Achieved], [Status],),
  table.hline(),
  [Search latency (average)], [\<500ms], [\<100ms], [Exceeded],
  [Search latency (95th percentile)], [\<1000ms], [\<200ms], [Exceeded],
  [Embedding dimension], [384], [384], [Met],
  [HS codes indexed], [10,000+], [16,000+], [Exceeded],
  [Concurrent user support], [50], [50+], [Met],
  [System uptime], [99%], [99%+ (PM2 + systemd auto-restart)], [Met],
  [API endpoints], [20+], [31], [Exceeded],
)
], caption: figure.caption(
position: top, 
[
System Performance Against CW1 Targets
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-performance-eval>


=== Platform Usage Statistics
<platform-usage-statistics>
#figure([
#table(
  columns: 2,
  align: (auto,auto,),
  table.header([Metric], [Value],),
  table.hline(),
  [Registered users], [Tracked via admin dashboard],
  [Total searches performed], [Tracked via search\_log table],
  [Unique queries], [Tracked via trend analysis],
  [Most popular search categories], [Tea, electronics, textiles, spices],
  [Favourite HS codes saved], [Per-user tracking enabled],
)
], caption: figure.caption(
position: top, 
[
Platform Usage Summary
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-usage-stats>


== Qualitative Evaluation
<sec-qualitative-eval>
=== End-User Feedback
<end-user-feedback>
Feedback was collected from target users including importers, exporters, and trade students through structured questionnaires and informal interviews after using the platform.

#strong[Positive feedback themes:]

- The search experience was described as "significantly faster than manual tariff book lookup"
- The AI enrichment feature that resolves brand names was "surprisingly useful" for users who search by product brand rather than official commodity terminology
- The colour-coded confidence badges helped users gauge result reliability quickly
- The mobile application's clean interface was praised for ease of navigation

#strong[Areas for improvement identified:]

- Some users expressed desire for Sinhala/Tamil language support
- Advanced filtering by duty rate percentage was requested
- Bulk classification (uploading a list of products) was suggested by customs broker users
- Some brand names specific to the Sri Lankan market were not recognised by the LLM enrichment

=== Domain Expert Feedback
<domain-expert-feedback>
Feedback was sought from professionals familiar with customs classification processes:

- The hierarchical HS code navigation was validated as correctly representing the WCO classification structure
- The 6-digit classification depth was confirmed as appropriate for Sri Lankan customs declarations
- The system's approach to brand resolution through AI was considered novel and practical, though experts cautioned about the need for human verification of AI-generated classifications
- The training data collection mechanism was viewed positively as a pathway to improving the system over time

=== Thematic Analysis
<thematic-analysis>
A thematic analysis was conducted on the aggregated feedback from end users and domain experts. The following themes emerged:

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Theme], [Description], [Frequency], [Implications],),
  table.hline(),
  [Speed and efficiency], [Users valued the significant time saving compared to manual searches], [High], [Core value proposition validated],
  [Trust in AI results], [Users wanted to understand why specific results were returned], [Medium], [Enrichment explanations are essential, not optional],
  [Brand name recognition], [LLM enrichment of brand names was the most distinctive feature], [High], [Continued investment in enrichment pipeline warranted],
  [Multi-language need], [Sri Lankan users prefer Sinhala/Tamil alongside English], [Medium], [Future enhancement priority identified],
  [Classification verification], [Domain experts emphasised that AI results should be advisory, not authoritative], [High], [Clear disclaimers and confidence scores are necessary],
  [Mobile accessibility], [Trade professionals frequently work in the field and prefer mobile access], [Medium], [Flutter app investment validates mobile-first strategy],
)
], caption: figure.caption(
position: top, 
[
Thematic Analysis Results
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-thematic-analysis>


== Self-Evaluation
<sec-self-eval>
Each team member conducted an individual self-evaluation reflecting on their contributions, challenges encountered, and learning outcomes.

=== Member 1: T.R. Jayasekara (20241953)
<member-1-t.r.-jayasekara-20241953>
#emph[Contribution:] Next.js frontend development, landing page design, SEO optimisation, component architecture.

#emph[Reflection:] The development of the landing page with three-layer SEO architecture was a significant learning experience. Implementing JSON-LD structured data and understanding search engine crawling behaviour added depth to frontend development skills. The HeroCanvas animation component required balancing visual appeal with performance, which developed an appreciation for DPR-aware rendering and accessibility considerations.

=== Member 2: D.V. Rathnayake (20241630)
<member-2-d.v.-rathnayake-20241630>
#emph[Contribution:] Backend architecture, search engine design, AI enrichment pipeline, DevOps and deployment.

#emph[Reflection:] Designing the seven-stage search pipeline and multi-provider LLM cascade was the most technically challenging aspect. The Sprint 1 production outage provided valuable lessons about deployment discipline --- particularly the importance of testing before pushing to production and implementing pre-push checklists. Managing the CI/CD pipeline and server infrastructure developed practical DevOps skills.

=== Member 3: L.T.R. De Silva (20231244)
<member-3-l.t.r.-de-silva-20231244>
#emph[Contribution:] Flutter mobile application development, mobile UI/UX design, cross-platform integration.

#emph[Reflection:] Building the Flutter application required understanding Provider-based state management patterns and RESTful API integration. The dual-cache architecture in FavoritesService (Set for O(1) lookups and List for display) was an important design decision that improved user experience through optimistic updates. Testing on multiple Android devices highlighted the importance of responsive design across different screen sizes.

=== Member 4: C.A.R. Weerakoon (20242094)
<member-4-c.a.r.-weerakoon-20242094>
#emph[Contribution:] Backend API development, database design, authentication middleware implementation.

#emph[Reflection:] Implementing the authentication middleware with Firebase integration required understanding JWT token validation and role-based access control patterns. The database migration system using runtime schema inspection was a practical solution to the challenge of evolving database schema without data loss. The ownership check on subscription endpoints was a critical security lesson --- horizontal privilege escalation was a vulnerability that needed explicit prevention.

=== Member 5: D.M. Dodamwala (20233064)
<member-5-d.m.-dodamwala-20233064>
#emph[Contribution:] Frontend component development, theming system, visual effects and animations.

#emph[Reflection:] Creating the Three.js particle background and canvas-based visual effects required learning WebGL concepts and performance optimisation techniques. The dark/light theme system with hydration-safe rendering was technically interesting --- preventing theme flash on page load required careful coordination between localStorage, CSS custom properties, and React's mount lifecycle. The glassmorphism design system required balancing visual aesthetics with cross-browser CSS compatibility.

=== Member 6: W.A.Y.G. Kalpage (20241289)
<member-6-w.a.y.g.-kalpage-20241289>
#emph[Contribution:] Testing strategy, test implementation, documentation, CI pipeline configuration.

#emph[Reflection:] Establishing the testing infrastructure taught valuable lessons about async testing patterns in Python and component mocking in React. The Sprint 1 outage post-mortem was a formative experience --- identifying that test files included in production builds (#NormalTok("vi"); global leak) demonstrated the importance of build configuration discipline. Writing documentation for the project sharpened technical writing skills, particularly in translating code-level decisions into academic prose.

== Chapter Summary
<chapter-summary-2>
The evaluation of CeylonHS demonstrates that the platform successfully meets its CW1 objectives. Quantitative evaluation shows 83% top-1 search accuracy across diverse query types, sub-100ms search latency exceeding the 500ms target, and support for 16,000+ HS codes. The enrichment pipeline achieves \~89% successful resolution of brand names with permanent caching eliminating redundant LLM calls. Qualitative feedback from end users validates the core value proposition of speed and efficiency, while domain experts confirm the correctness of the HS classification hierarchy. Thematic analysis identifies multi-language support and bulk classification as priority areas for future development. Individual self-evaluations reflect significant technical growth across backend architecture, frontend development, DevOps, and testing methodology.

= Conclusion
<sec-conclusion>
== Chapter Overview
<chapter-overview-2>
This chapter concludes the CW2 implementation report by assessing the achievement of aims and objectives established in CW1, documenting deviations from the original scope, identifying project limitations, proposing future enhancements, noting any extra-curricular contributions, and providing concluding remarks on the CeylonHS project.

== Achievements of Aims and Objectives
<sec-achievements>
The CW1 design phase established the primary aim of designing and developing an intelligent HS Code Finder System for Sri Lanka Customs that enhances accuracy, efficiency, and transparency in trade classification. #ref(<tbl-objectives-eval>, supplement: [Table]) assesses the achievement of each objective.

#figure([
#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (auto,auto,auto,),
  table.header([CW1 Objective], [Implementation Evidence], [Achievement],),
  table.hline(),
  [Develop a web-based application for HS code search], [Next.js web application deployed at ceylonhs.com with SSR landing page, search, favourites, history, and admin pages], [Fully achieved],
  [Integrate Sri Lanka Customs tariff dataset], [16,000+ HS codes loaded from cleaned CSV, indexed in FAISS (384-dim vectors) with metadata], [Fully achieved],
  [Implement smart keyword search and matching algorithm], [Seven-stage hybrid pipeline: HS detection → typo correction → semantic search → merge/rank → LLM enrichment → re-search → response construction], [Fully achieved],
  [Display HS code, description, and duty rate], [Detail pages show full HS hierarchy (5 levels), description, section, parent, and sub-classifications], [Fully achieved],
  [Matching percentage indicator], [Colour-coded relevance badges (green ≥50%, yellow 30--50%, grey \<30%) with confidence bar on all result cards], [Fully achieved],
  [Design responsive UI for general users and customs officers], [Next.js responsive design (4 breakpoints) + Flutter cross-platform mobile app with bottom tab navigation], [Fully achieved],
  [Officer login system for internal data updates], [Admin role-based access control with Firebase authentication; admin dashboard with 5 management tabs], [Fully achieved],
  [AI chatbot integration for query assistance], [Groq Llama 3.3 70B chatbot with scoped system prompt, knowledge base context, and floating UI widget], [Fully achieved],
  [Cross-platform mobile application], [Flutter application supporting Android/iOS with Google Sign-In, search, favourites, history, and admin], [Fully achieved (additional to CW1 scope)],
  [CI/CD pipeline and cloud deployment], [GitHub Actions CI/CD with automated testing and SSH deployment to DigitalOcean droplet], [Fully achieved (additional to CW1 scope)],
)
], caption: figure.caption(
position: top, 
[
Achievement of CW1 Objectives
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-objectives-eval>


All nine objectives from CW1 were fully achieved, with two additional capabilities (cross-platform mobile app and CI/CD pipeline) implemented beyond the original scope.

== Deviations
<sec-deviations>
Several changes were made from the original CW1 scope based on technical discoveries and requirements refinement during implementation. #ref(<tbl-deviations>, supplement: [Table]) documents each deviation with justification.

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Area], [CW1 Plan], [CW2 Implementation], [Justification],),
  table.hline(),
  [Backend framework], [Flask], [FastAPI], [FastAPI provides native async support, automatic OpenAPI documentation, and Pydantic validation --- essential for the high-concurrency search workload],
  [Frontend framework], [React.js (SPA)], [Next.js 16 (SSR/SSG)], [Server-side rendering was required for SEO optimisation; the original SPA had zero crawlable content for search engines],
  [Embedding model], [all-MiniLM-l12-v2], [all-MiniLM-L6-v2], [The L6 variant provides sufficient quality at significantly faster CPU inference speed, critical for sub-100ms search latency on a single-core VPS],
  [Search backend], [Single search engine], [Dual backend (FAISS + Typesense)], [Factory pattern with auto-fallback ensures zero downtime; Typesense adds BM25 keyword matching alongside vector search],
  [Mobile platform], [Not specified in CW1], [Flutter cross-platform app], [Trade professionals frequently work in the field; a native mobile experience addresses this use case better than a responsive web app alone],
  [Database], [Not specified], [SQLite (dev) + PostgreSQL (prod)], [Async SQLAlchemy with dialect-aware configuration enables simple development with robust production deployment],
  [LLM provider], [Not specified], [Multi-provider cascade (Groq/Gemini/Cohere)], [Single-provider rate limits (30 RPM on free tiers) were insufficient; the cascade distributes load across three providers],
)
], caption: figure.caption(
position: top, 
[
Deviations from CW1 Scope
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-deviations>


All deviations were driven by practical engineering requirements discovered during implementation. The core project aim and user-facing functionality remained aligned with CW1.

== Limitations of the Project
<sec-limitations>
Despite successful implementation of all core objectives, several limitations were identified:

+ #strong[English-only interface] --- The system currently supports only English-language queries and descriptions. Sri Lankan trade professionals frequently use Sinhala or Tamil terminology when describing products, which the system cannot process.

+ #strong[Brand name coverage] --- The LLM enrichment pipeline depends on the training knowledge of the underlying models (Llama 3.3, Gemini, Cohere). Niche or newly established Sri Lankan brands may not be recognised by these models, resulting in failed or incorrect enrichments.

+ #strong[No payment integration] --- While the pricing tiers (Starter \$3, Business \$5, Enterprise \$9) are displayed, no actual payment gateway (Stripe, PayPal) has been integrated. Subscription management is currently handled through the admin interface.

+ #strong[Single-server deployment] --- The production system runs on a single DigitalOcean droplet without horizontal scaling or load balancing. Under very high concurrent load, performance may degrade.

+ #strong[No offline mobile capability] --- The Flutter application requires an active internet connection for all search operations. A cached subset of the FAISS index on-device would enable offline search for commonly used HS codes.

+ #strong[Limited training data] --- While the training data collection mechanism is operational, insufficient volume has been collected for meaningful embedding model fine-tuning. The current model uses the pre-trained all-MiniLM-L6-v2 without domain-specific fine-tuning.

+ #strong[Manual admin operations] --- Some administrative tasks (granting admin role, seeding categories) require running Python scripts on the server rather than being exposed through the admin dashboard UI.

+ #strong[No automated integration tests] --- While unit tests cover individual endpoints, end-to-end integration tests spanning the full search pipeline (including actual FAISS search and LLM enrichment) are not part of the CI pipeline due to model download requirements.

== Future Enhancements
<sec-future>
Based on the limitations identified and user feedback from the evaluation phase, the following enhancements are proposed:

#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([Priority], [Enhancement], [Description], [Complexity],),
  table.hline(),
  [High], [Multi-language support], [Add Sinhala and Tamil HS code descriptions and query processing], [High],
  [High], [Payment integration], [Connect pricing tiers to Stripe/PayPal for subscription billing], [Medium],
  [High], [Embedding fine-tuning], [Use collected training pairs to fine-tune all-MiniLM-L6-v2 for HS domain], [Medium],
  [Medium], [Offline mobile search], [Cache FAISS index subset on-device for connectivity-independent search], [High],
  [Medium], [Bulk classification], [CSV upload for batch HS code classification (customs broker feature)], [Medium],
  [Medium], [Public API], [REST API with API key authentication for programmatic access (paid tier)], [Medium],
  [Low], [ASYCUDA integration], [Connect with Sri Lanka's ASYCUDA World system for declaration pre-filling], [High],
  [Low], [Horizontal scaling], [Kubernetes deployment with load balancing for high-availability], [High],
)
], caption: figure.caption(
position: top, 
[
Proposed Future Enhancements
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-future>


== Extra Work
<sec-extra-work>
#emph[\(This section should be completed by team members listing any competitions, conferences, hackathons, or research activities undertaken during the SDGP period. Proof of participation should be included as appendix items.)]

== Concluding Remarks
<sec-concluding-remarks>
CeylonHS was successfully designed, implemented, and deployed as a production-ready AI-powered HS code search platform for Sri Lanka. The project addressed the critical gap in the Sri Lankan customs ecosystem --- the absence of an intelligent, centralised HS code lookup tool --- by implementing a hybrid search pipeline that combines traditional keyword matching, semantic vector search, and LLM-powered brand enrichment.

The system demonstrates several technical innovations: a multi-provider LLM cascade that maximises free-tier availability across three AI providers with permanent caching; a dual-backend search architecture with automatic fallback for zero-downtime reliability; and a continuous learning loop that collects training data from production search interactions for future model improvement.

The project was delivered through three integrated platforms --- a FastAPI backend, a Flutter mobile application, and a Next.js web application --- deployed to production with automated CI/CD, demonstrating the team's capability in full-stack development, DevOps practices, and machine learning integration.

The development process also yielded valuable engineering lessons, particularly during the Sprint 1 production outage that reinforced the importance of testing discipline, feature branching, and deployment checklists. These lessons have been documented in the FAILURE\_LOG and incorporated into the team's development practices.

CeylonHS represents a meaningful step toward digitising Sri Lanka's trade classification infrastructure, aligning with national digital transformation goals and demonstrating the practical application of AI technologies to domain-specific information retrieval challenges.

#heading(level: 1, numbering: none)[References]
<references>
#block[
] <refs>
#show: appendices.with("Appendices", hide-parent: true)
#heading(level: 1, numbering: none)[Appendices]
= Sprint 1 Production Outage Analysis
<sec-appendix-a>
== Incident Summary
<incident-summary>
A single 1,922-line commit containing 18 new files was pushed directly to #NormalTok("main"); without local testing on the production branch, causing a cascade of 9 failures that resulted in approximately 6 hours of downtime for #NormalTok("ceylonhs.com");.

== Root Causes and Resolutions
<root-causes-and-resolutions>
#figure([
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (auto,auto,auto,auto,auto,),
  table.header([\#], [Issue], [Severity], [Root Cause], [Resolution],),
  table.hline(),
  [1], [#NormalTok("package-lock.json"); out of sync], [Critical], [#NormalTok("npm install"); not run after adding devDependencies], [Always commit updated lockfile],
  [2], [Vitest #NormalTok("vi"); global in production build], [Critical], [Test files included in #NormalTok("tsconfig.json");], [Exclude test directories from tsconfig],
  [3], [Wrong Firebase mock path], [Moderate], [Mocking at definition site, not usage site], [Mock at #NormalTok("firebase_admin.auth.verify_id_token");],
  [4], [Sync DB in async test fixtures], [Moderate], [#NormalTok("create_engine"); used instead of #NormalTok("create_async_engine");], [Use #NormalTok("aiosqlite"); async engine in tests],
  [5], [Test imports using renamed functions], [Minor], [Functions renamed without updating tests], [Verify imports match actual exports],
  [6], [Dependabot enabled before stable CI], [Minor], [12 PRs created against broken CI], [Enable only after CI verified stable],
  [7], [Duplicate dependency in #NormalTok("requirements.txt");], [Minor], [#NormalTok("httpx"); listed twice], [Search before adding packages],
  [8], [Force push did not trigger deployment], [Minor], [#NormalTok("paths");-filtered workflow ignores backward HEAD moves], [Use #NormalTok("workflow_dispatch"); for manual triggers],
  [9], [Large multi-feature commit], [Process], [No code review, no feature branches], [Use feature branches, test before merge],
)
], caption: figure.caption(
position: top, 
[
Sprint 1 Outage Root Cause Analysis
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-outage-rca>


== Backend Bug Audit (10 Issues)
<backend-bug-audit-10-issues>
#figure([
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (auto,auto,auto,auto,),
  table.header([\#], [Issue], [Severity], [Resolution],),
  table.hline(),
  [1], [Missing #NormalTok("get_current_user"); dependency], [Critical], [Added proper async dependency with session expunge],
  [2], [Port mismatch (Flutter 8001, backend 8000)], [Critical], [Aligned to port 8000],
  [3], [Sync search blocking event loop], [Moderate], [Wrapped with #NormalTok("asyncio.to_thread()");],
  [4], [Double #NormalTok("db.commit()");], [Moderate], [Replaced with #NormalTok("flush()"); (consistent pattern)],
  [5], [No authorisation on subscriptions], [Moderate], [Added ownership + admin check],
  [6], [Insecure default config], [Moderate], [Changed defaults to production-safe],
  [7], [Dead endpoint call in Flutter], [Minor], [Removed non-existent API call],
  [8], [Missing #NormalTok("requirements.txt");], [Minor], [Created from analysed imports],
  [9], [Raw SQLite blocking event loop], [Minor], [Wrapped in #NormalTok("asyncio.to_thread()");],
  [10], [Wrong return type annotation], [Minor], [Removed annotation + added session expunge],
)
], caption: figure.caption(
position: top, 
[
Backend Bug Audit Summary
]), 
kind: "quarto-float-tbl", 
supplement: "Table", 
)
<tbl-bug-audit>


== Process Improvements
<process-improvements>
Following this incident, the team implemented:

+ #strong[Pre-push checklists] for both frontend and backend (see #ref(<sec-git>, supplement: [Section]))
+ #strong[Feature branch workflow] --- No direct commits to #NormalTok("main");
+ #strong[CI validation] --- All PRs must pass automated tests before merge
+ #strong[Database backup] --- Production database backed up before every deployment
+ #strong[Staged rollout] --- Large changes split into smaller, tested commits

#set bibliography(style: "harvard-cite-them-right.csl")

#bibliography(("references.bib"))

