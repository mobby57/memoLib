#!/usr/bin/env python3
import hashlib
import difflib
import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

# --- Domain models (in-memory demo) -------------------------------------------------

@dataclass
class Client:
    id: int
    email: Optional[str]
    first_name: str
    last_name: str

    def full_name(self) -> str:
        return f"{self.first_name.strip().lower()} {self.last_name.strip().lower()}".strip()

@dataclass
class Case:
    id: int
    client_id: int
    title: str

    def norm_title(self) -> str:
        return self.title.strip().lower()

@dataclass
class Doc:
    id: int
    case_id: int
    name: str
    sha256: str

@dataclass
class Event:
    ts: float
    action: str
    details: str

# --- In-memory stores ---------------------------------------------------------------

class Store:
    def __init__(self):
        self.clients: List[Client] = []
        self.cases: List[Case] = []
        self.docs: List[Doc] = []
        self.events: List[Event] = []
        self._cid = 1
        self._caseid = 1
        self._docid = 1

    def log(self, action: str, details: str):
        self.events.append(Event(ts=time.time(), action=action, details=details))

    # --- Clients ---
    def find_client_by_email(self, email: Optional[str]) -> Optional[Client]:
        if not email:
            return None
        for c in self.clients:
            if c.email and c.email.strip().lower() == email.strip().lower():
                return c
        return None

    def fuzzy_find_client_by_name(self, first_name: str, last_name: str, threshold: float = 0.88) -> Optional[Client]:
        if not (first_name or last_name):
            return None
        name = f"{(first_name or '').strip().lower()} {(last_name or '').strip().lower()}".strip()
        best: Tuple[float, Optional[Client]] = (0.0, None)
        for c in self.clients:
            ratio = difflib.SequenceMatcher(None, c.full_name(), name).ratio()
            if ratio > best[0]:
                best = (ratio, c)
        return best[1] if best[0] >= threshold else None

    def create_client(self, email: Optional[str], first_name: str, last_name: str) -> Client:
        c = Client(id=self._cid, email=email, first_name=first_name, last_name=last_name)
        self._cid += 1
        self.clients.append(c)
        self.log("client.create", f"id={c.id} email={email} name={first_name} {last_name}")
        return c

    # --- Cases ---
    def find_case(self, client_id: int, title: str) -> Optional[Case]:
        norm = title.strip().lower()
        for cs in self.cases:
            if cs.client_id == client_id and cs.norm_title() == norm:
                return cs
        return None

    def create_case(self, client_id: int, title: str) -> Case:
        cs = Case(id=self._caseid, client_id=client_id, title=title)
        self._caseid += 1
        self.cases.append(cs)
        self.log("case.create", f"id={cs.id} client_id={client_id} title={title}")
        return cs

    # --- Docs ---
    def find_doc_by_hash(self, case_id: int, sha256: str) -> Optional[Doc]:
        for d in self.docs:
            if d.case_id == case_id and d.sha256 == sha256:
                return d
        return None

    def create_doc(self, case_id: int, name: str, content: bytes) -> Tuple[Doc, bool]:
        sha = hashlib.sha256(content).hexdigest()
        existing = self.find_doc_by_hash(case_id, sha)
        if existing:
            self.log("doc.skip_duplicate", f"case_id={case_id} name={name} sha256={sha}")
            return existing, False
        d = Doc(id=self._docid, case_id=case_id, name=name, sha256=sha)
        self._docid += 1
        self.docs.append(d)
        self.log("doc.create", f"id={d.id} case_id={case_id} name={name} sha256={sha}")
        return d, True

# --- Core logic ---------------------------------------------------------------------

def identify_or_create_client(store: Store, email: Optional[str], first_name: str, last_name: str) -> Client:
    c = store.find_client_by_email(email)
    if c:
        store.log("client.match_email", f"id={c.id} email={email}")
        return c
    c = store.fuzzy_find_client_by_name(first_name, last_name)
    if c:
        store.log("client.match_name", f"id={c.id} name={first_name} {last_name}")
        return c
    return store.create_client(email=email, first_name=first_name, last_name=last_name)


def associate_case(store: Store, client: Client, title: str) -> Case:
    cs = store.find_case(client.id, title)
    if cs:
        store.log("case.match", f"id={cs.id} client_id={client.id} title={title}")
        return cs
    return store.create_case(client.id, title)


def ingest_document(store: Store, case: Case, name: str, content: bytes) -> Tuple[Doc, bool]:
    return store.create_doc(case.id, name, content)

# --- Demo ---------------------------------------------------------------------------

if __name__ == "__main__":
    s = Store()

    # Incoming item #1
    client = identify_or_create_client(s, email="alice@example.com", first_name="Alice", last_name="Martin")
    case = associate_case(s, client, title="Dossier Contrat 2026")
    doc, created = ingest_document(s, case, name="contrat.pdf", content=b"PDF_CONTENT_V1")

    # Incoming item #2 (duplicate by email)
    client2 = identify_or_create_client(s, email="ALICE@example.com", first_name="Alicia", last_name="Martins")
    assert client2.id == client.id
    case2 = associate_case(s, client2, title="dossier contrat 2026")  # normalized title
    doc2, created2 = ingest_document(s, case2, name="contrat-copy.pdf", content=b"PDF_CONTENT_V1")  # same content → duplicate

    # Incoming item #3 (fuzzy name match)
    client3 = identify_or_create_client(s, email=None, first_name="Alyce", last_name="Martine")
    assert client3.id == client.id
    case3 = associate_case(s, client3, title="Dossier Contrat 2026")
    doc3, created3 = ingest_document(s, case3, name="annexe.pdf", content=b"ANNEXE_V1")

    # Print a compact summary
    print("Clients:", s.clients)
    print("Cases:", s.cases)
    print("Docs:", s.docs)
    print("Events (last 5):")
    for e in s.events[-5:]:
        print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(e.ts)), e.action, e.details)
