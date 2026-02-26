/**
 * Tests pour le composant Input
 * Couverture: props, �tats, accessibilit�
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  describe('Rendu de base', () => {
    it('devrait rendre un input', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('devrait avoir les classes de base', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-10', 'w-full', 'rounded-md', 'border');
    });
  });

  describe('Types', () => {
    it('devrait rendre un input text par d�faut', () => {
      render(<Input data-testid="input" />);
      // Le type peut �tre undefined si non sp�cifi�, ce qui est �quivalent � text
      const input = screen.getByTestId('input');
      const type = input.getAttribute('type');
      expect(type === null || type === 'text').toBe(true);
    });

    it('devrait rendre un input email', () => {
      render(<Input type="email" placeholder="Email" />);
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
    });

    it('devrait rendre un input password', () => {
      render(<Input type="password" data-testid="pwd" />);
      expect(screen.getByTestId('pwd')).toHaveAttribute('type', 'password');
    });

    it('devrait rendre un input number', () => {
      render(<Input type="number" data-testid="num" />);
      expect(screen.getByTestId('num')).toHaveAttribute('type', 'number');
    });
  });

  describe('Placeholder', () => {
    it('devrait afficher le placeholder', () => {
      render(<Input placeholder="Entrez votre nom" />);
      expect(screen.getByPlaceholderText('Entrez votre nom')).toBeInTheDocument();
    });

    it('devrait avoir le style de placeholder', () => {
      render(<Input placeholder="Test" />);
      expect(screen.getByRole('textbox')).toHaveClass('placeholder:text-gray-400');
    });
  });

  describe('Valeur', () => {
    it('devrait accepter une valeur contr�l�e', () => {
      render(<Input value="valeur test" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('valeur test');
    });

    it('devrait accepter une valeur par d�faut', () => {
      render(<Input defaultValue="valeur par d�faut" />);
      expect(screen.getByRole('textbox')).toHaveValue('valeur par d�faut');
    });

    it('devrait d�clencher onChange lors de la saisie', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      
      await userEvent.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('�tats', () => {
    it('devrait �tre d�sactiv� quand disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('devrait avoir les styles disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('devrait �tre en lecture seule quand readOnly', () => {
      render(<Input readOnly defaultValue="lecture seule" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('devrait �tre requis quand required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('Focus et styles', () => {
    it('devrait avoir les styles de focus', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('devrait avoir le ring bleu au focus', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveClass('focus:ring-blue-400');
    });

    it('devrait �tre focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Classes personnalis�es', () => {
    it('devrait accepter des classes personnalis�es', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('devrait combiner les classes', () => {
      render(<Input className="mt-4 border-red-500" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('mt-4', 'border-red-500', 'rounded-md');
    });
  });

  describe('Attributs HTML', () => {
    it('devrait accepter name', () => {
      render(<Input name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('devrait accepter id', () => {
      render(<Input id="my-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
    });

    it('devrait accepter maxLength', () => {
      render(<Input maxLength={50} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '50');
    });

    it('devrait accepter min/max pour number', () => {
      render(<Input type="number" min={0} max={100} data-testid="num" />);
      const input = screen.getByTestId('num');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('devrait accepter pattern', () => {
      render(<Input pattern="[A-Za-z]+" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
    });
  });

  describe('Ref forwarding', () => {
    it('devrait transmettre la ref', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('devrait permettre de focus via ref', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Input ref={ref} />);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Accessibilit�', () => {
    it('devrait accepter aria-label', () => {
      render(<Input aria-label="Champ de recherche" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Champ de recherche');
    });

    it('devrait accepter aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="helper-text" />
          <span id="helper-text">Texte d'aide</span>
        </>
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('devrait accepter aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('�v�nements', () => {
    it('devrait d�clencher onFocus', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      
      screen.getByRole('textbox').focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('devrait d�clencher onBlur', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('devrait d�clencher onKeyDown', async () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      
      await userEvent.type(screen.getByRole('textbox'), '{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });
});
