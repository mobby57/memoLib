# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Memolib Memolib" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "Memolib" [ref=e5]
        - generic [ref=e6]: Memolib
      - navigation [ref=e7]:
        - link "Clients" [ref=e8] [cursor=pointer]:
          - /url: /clients
        - link "Avocat" [ref=e9] [cursor=pointer]:
          - /url: /legal/avocat
        - link "Paiements" [ref=e10] [cursor=pointer]:
          - /url: /billing
        - link "Admin" [ref=e11] [cursor=pointer]:
          - /url: /admin/dashboard
  - generic [ref=e13]:
    - heading "404" [level=1] [ref=e14]
    - heading "This page could not be found." [level=2] [ref=e16]
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e26]
```