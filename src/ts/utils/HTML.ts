/** This is a (kindof) Singleton class. The purpose of this is to handle some frequently used HTML/CSS manipulations */

export class HTML
{
	public static addToClassList(elements: HTMLCollectionOf<Element>, className: string)
	{
		for (let i = 0; i < elements.length; ++i)
		{
			elements[i].classList.add(className);
		}
	}

	public static removeFromClassList(elements: HTMLCollectionOf<Element> | NodeListOf<Element>, className: string)
	{
		for (let i = 0; i < elements.length; ++i)
		{
			elements[i].classList.remove(className);
		}
	}

	public static addListenerToHTMLElements(elements: HTMLCollectionOf<Element>, type: string, listener: () => any)
	{
		for (let i = 0; i < elements.length; ++i)
		{
			elements[i].addEventListener(type, listener);
		}
	}

	public static removeListenerFromHTMLElements(elements: HTMLCollectionOf<Element>, type: string, listener: () => any)
	{
		for (let i = 0; i < elements.length; ++i)
		{
			elements[i].removeEventListener(type, listener);
		}
	}

	public static addStyleToHTMLElements(elements: HTMLCollectionOf<Element>, key: string, value: string)
	{
		for (let i = 0; i < elements.length; ++i)
		{
			(<HTMLElement>elements[i]).style[key] = value;
		}
	}

	public static clearElement(element: HTMLElement)
	{
		while (element.firstChild)
		{
			element.removeChild(element.firstChild);
		}
	}

	public static hideElement(element: HTMLElement)
	{
		element.style.display = 'none';
	}

	public static showElement(element: HTMLElement, isHiddenByDefault: boolean = false)
	{
		element.style.display = isHiddenByDefault ? 'block' : '';
	}

	public static isElementChildOfElement(element: Element, parent: Element): boolean
	{
		return parent.contains(element);
	}

	public static disableElement(element: Element)
	{
		element.classList.add('disabledPointerActions');
	}

	public static enableElement(element: Element)
	{
		element.classList.remove('disabledPointerActions');
	}
}