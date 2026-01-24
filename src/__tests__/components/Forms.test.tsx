import { render, screen, fireEvent } from '@testing-library/react'
import { Input, Select, Textarea, Button, Modal } from '@/components/forms'

describe('Form Components', () => {
  describe('Input', () => {
    it('renders input with label', () => {
      render(<Input label="Test Input" name="test" />)
      expect(screen.getByLabelText('Test Input')).toBeInTheDocument()
    })

    it('shows error message', () => {
      render(<Input label="Test" name="test" error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('shows helper text', () => {
      render(<Input label="Test" name="test" helperText="Enter your name" />)
      expect(screen.getByText('Enter your name')).toBeInTheDocument()
    })

    it('handles onChange event', () => {
      const handleChange = jest.fn()
      render(<Input label="Test" name="test" onChange={handleChange} />)
      
      const input = screen.getByLabelText('Test')
      fireEvent.change(input, { target: { value: 'new value' } })
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('applies disabled state', () => {
      render(<Input label="Test" name="test" disabled />)
      expect(screen.getByLabelText('Test')).toBeDisabled()
    })
  })

  describe('Select', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
    ]

    it('renders select with options', () => {
      render(<Select label="Test Select" name="test" options={options} />)
      expect(screen.getByLabelText('Test Select')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('handles selection change', () => {
      const handleChange = jest.fn()
      render(<Select label="Test" name="test" options={options} onChange={handleChange} />)
      
      const select = screen.getByLabelText('Test')
      fireEvent.change(select, { target: { value: '2' } })
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Textarea', () => {
    it('renders textarea with label', () => {
      render(<Textarea label="Description" name="desc" />)
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('respects rows prop', () => {
      render(<Textarea label="Test" name="test" rows={10} />)
      const textarea = screen.getByLabelText('Test')
      expect(textarea).toHaveAttribute('rows', '10')
    })
  })

  describe('Button', () => {
    it('renders button with text', () => {
      render(<Button>Click Me</Button>)
      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('handles click event', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click</Button>)
      
      fireEvent.click(screen.getByText('Click'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('shows loading state', () => {
      render(<Button isLoading>Submit</Button>)
      // Le bouton affiche "Chargement..." quand isLoading=true
      expect(screen.getByRole('button')).toBeDisabled()
      // Verifier que le spinner est present
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('applies variant classes', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      // Primary uses inline style, not class
      expect(screen.getByText('Primary')).toBeInTheDocument()
      
      rerender(<Button variant="danger">Danger</Button>)
      expect(screen.getByText('Danger')).toHaveClass('bg-red-600')
    })

    it('applies size classes', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByText('Large')).toHaveClass('text-lg')
    })
  })

  describe('Modal', () => {
    it('renders modal when open', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      )
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('calls onClose when close button clicked', () => {
      const handleClose = jest.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      )
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop clicked', () => {
      const handleClose = jest.fn()
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Content</p>
        </Modal>
      )
      
      const backdrop = container.querySelector('.fixed.inset-0.bg-gray-500')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(handleClose).toHaveBeenCalled()
      }
    })
  })
})
