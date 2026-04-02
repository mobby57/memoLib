import hashlib
import json
from datetime import datetime
from pathlib import Path

class LegalBlockchain:
    """Simple blockchain for legal document verification"""
    
    def __init__(self):
        self.chain = []
        self.pending_documents = []
        self.blockchain_file = Path('data/legal_blockchain.json')
        self.load_blockchain()
        
        # Create genesis block if chain is empty
        if not self.chain:
            self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block in the blockchain"""
        genesis_block = {
            'index': 0,
            'timestamp': datetime.now().isoformat(),
            'documents': [],
            'previous_hash': '0',
            'hash': self.calculate_hash(0, datetime.now().isoformat(), [], '0')
        }
        self.chain.append(genesis_block)
        self.save_blockchain()
    
    def calculate_hash(self, index, timestamp, documents, previous_hash):
        """Calculate SHA-256 hash for a block"""
        block_string = f"{index}{timestamp}{json.dumps(documents, sort_keys=True)}{previous_hash}"
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def get_latest_block(self):
        """Get the most recent block in the chain"""
        return self.chain[-1] if self.chain else None
    
    def add_document(self, document_type, client_name, content_hash, metadata=None):
        """Add a legal document to the pending list"""
        document = {
            'id': len(self.pending_documents) + 1,
            'type': document_type,
            'client': client_name,
            'content_hash': content_hash,
            'metadata': metadata or {},
            'timestamp': datetime.now().isoformat(),
            'verified': True
        }
        self.pending_documents.append(document)
        return document['id']
    
    def mine_block(self):
        """Create a new block with pending documents"""
        if not self.pending_documents:
            return None
        
        latest_block = self.get_latest_block()
        new_index = latest_block['index'] + 1
        new_timestamp = datetime.now().isoformat()
        new_previous_hash = latest_block['hash']
        
        new_block = {
            'index': new_index,
            'timestamp': new_timestamp,
            'documents': self.pending_documents.copy(),
            'previous_hash': new_previous_hash,
            'hash': self.calculate_hash(new_index, new_timestamp, self.pending_documents, new_previous_hash)
        }
        
        self.chain.append(new_block)
        self.pending_documents = []
        self.save_blockchain()
        
        return new_block
    
    def verify_document(self, document_id, content_hash):
        """Verify a document exists in the blockchain"""
        for block in self.chain:
            for doc in block['documents']:
                if doc['id'] == document_id and doc['content_hash'] == content_hash:
                    return {
                        'verified': True,
                        'block_index': block['index'],
                        'timestamp': doc['timestamp'],
                        'document': doc
                    }
        return {'verified': False}
    
    def get_client_documents(self, client_name):
        """Get all documents for a specific client"""
        client_docs = []
        for block in self.chain:
            for doc in block['documents']:
                if doc['client'].lower() == client_name.lower():
                    client_docs.append({
                        'document': doc,
                        'block_index': block['index'],
                        'block_hash': block['hash']
                    })
        return client_docs
    
    def is_chain_valid(self):
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]
            
            # Check if current block's hash is correct
            calculated_hash = self.calculate_hash(
                current_block['index'],
                current_block['timestamp'],
                current_block['documents'],
                current_block['previous_hash']
            )
            
            if current_block['hash'] != calculated_hash:
                return False
            
            # Check if previous hash matches
            if current_block['previous_hash'] != previous_block['hash']:
                return False
        
        return True
    
    def save_blockchain(self):
        """Save blockchain to file"""
        try:
            with open(self.blockchain_file, 'w') as f:
                json.dump(self.chain, f, indent=2)
        except Exception as e:
            print(f"Error saving blockchain: {e}")
    
    def load_blockchain(self):
        """Load blockchain from file"""
        try:
            if self.blockchain_file.exists():
                with open(self.blockchain_file, 'r') as f:
                    self.chain = json.load(f)
        except Exception as e:
            print(f"Error loading blockchain: {e}")
            self.chain = []
    
    def get_blockchain_stats(self):
        """Get blockchain statistics"""
        total_documents = sum(len(block['documents']) for block in self.chain)
        return {
            'total_blocks': len(self.chain),
            'total_documents': total_documents,
            'pending_documents': len(self.pending_documents),
            'is_valid': self.is_chain_valid(),
            'latest_block_hash': self.get_latest_block()['hash'] if self.chain else None
        }

# Global blockchain instance
legal_blockchain = LegalBlockchain()

def hash_document_content(content):
    """Create hash of document content"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def register_legal_document(doc_type, client_name, content, metadata=None):
    """Register a legal document in the blockchain"""
    content_hash = hash_document_content(content)
    doc_id = legal_blockchain.add_document(doc_type, client_name, content_hash, metadata)
    
    # Mine block if we have enough pending documents (or immediately for demo)
    legal_blockchain.mine_block()
    
    return {
        'document_id': doc_id,
        'content_hash': content_hash,
        'registered': True,
        'blockchain_verified': True
    }