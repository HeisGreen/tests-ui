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
  animateElements.forEach((el) => observer.observe(el))

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
