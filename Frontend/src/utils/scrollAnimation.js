export function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        // Optionally stop observing after animation
        // observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Observe all elements with scroll-animate class
  const animateElements = document.querySelectorAll('.scroll-animate')
  animateElements.forEach((el) => {
    // Check if element is already in viewport before observing
    const rect = el.getBoundingClientRect()
    const isInView = rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0 && rect.height > 0
    if (isInView || rect.top < 200) {
      // Element is already visible or close to viewport, add animate-in immediately
      el.classList.add('animate-in')
    } else {
      // Element is not in viewport, observe it
      observer.observe(el)
    }
  })

  return observer
}

export function initScrollAnimationsForElement(element) {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, observerOptions)

  const animateElements = element.querySelectorAll('.scroll-animate')
  animateElements.forEach((el) => observer.observe(el))

  return observer
}
