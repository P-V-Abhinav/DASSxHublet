# Project Plan - Hublet Real Estate Platform

**Course:** DASS Spring 2026  
**Project Duration:** January 18, 2026 - February 13, 2026  
**Team:** Team 46

---

## 👥 Team

- Rakshit Aggarwal
- Rachit
- Abhi
- Jainik
- Arijeet

---

## 📅 Milestones

### **Week 1: January 18-25, 2026** ✅ COMPLETED
**Theme:** Feasibility Study & Requirements Gathering

**Key Activities:**
- Understanding the project scope and objectives
- Gathering and documenting requirements
- Feasibility analysis of proposed solution
- Initial team coordination and planning
- Research on real estate domain and matching algorithms
- Defining project scope and boundaries

**Deliverables:**
- Requirements documentation
- Feasibility report
- Initial project understanding
- Team alignment on goals

**Status:** ✅ Completed

---

### **Week 2: January 26 - February 1, 2026** ✅ COMPLETED
**Theme:** Design Phase & Planning

**Key Activities:**
- Coordinating among team members to finalize requirements
- Technology stack selection and justification
  - Frontend: React + Vite + TypeScript
  - Backend: Node.js + Express + TypeScript
  - Database: SQLite + Prisma ORM
- Architecture design and system design
- Database schema design
- API endpoint planning
- UI/UX mockups and component planning
- Development environment setup

**Deliverables:**
- Complete architecture design
- Technology stack finalized
- Role assignments completed
- Database schema designed
- Development environment ready
- Design documents

**Status:** ✅ Completed

---

### **Week 3: February 2-6, 2026** 🔄 IN PROGRESS
**Theme:** Backend Development

**Key Activities:**
- Building complete backend using SQLite and Prisma ORM
- Implementing REST API endpoints
  - Buyer CRUD operations
  - Seller CRUD operations
  - Property management APIs
  - Lead management APIs
  - Matching service APIs
- Developing business logic
  - Rule-based matching algorithm
  - Intent parser (keyword extraction)
  - Lead lifecycle state machine
- Database implementation and seeding
- API testing and validation
- Planning frontend development (to be started)

**Planned Activities (Continuing):**
- Complete backend testing
- Begin frontend development
- Integrate frontend with backend APIs
- Implement UI components

**Deliverables:**
- Functional backend with SQLite
- Complete REST API
- Matching algorithm implemented
- State machine working
- Database with seed data
- (Planned) Frontend components

**Status:** 🔄 Backend completed, Frontend development starting

---

### **Week 4: February 7-13, 2026** 📋 PLANNED
**Theme:** Frontend Development, Integration & Testing

**Planned Activities:**
- Complete frontend development
  - Admin dashboard
  - Buyer dashboard
  - Seller dashboard
- Frontend-Backend integration
- End-to-end testing
- Bug fixes and refinements
- Documentation completion
- Demo preparation
- Client feedback integration

**Expected Deliverables:**
- Complete three-view system
- Fully integrated application
- Comprehensive testing
- Final documentation
- Demo-ready prototype

**Status:** 📋 To be started after client meeting feedback

---

## ⚠️ Risks & Mitigations

### **Risk 1: Timeline Constraints**
- **Risk:** Limited time to complete both frontend and backend
- **Mitigation:** 
  - Clear role division established in Week 2
  - Focus on core features first
  - Defer advanced features to future phases
  - Parallel development where possible

### **Risk 2: Technology Learning Curve**
- **Risk:** Team learning new technologies (Prisma, React, TypeScript)
- **Mitigation:** 
  - Selected technologies with good documentation
  - Team members support each other
  - Focus on proven, stable technologies
  - Early prototyping to validate choices

### **Risk 3: Integration Challenges**
- **Risk:** Frontend-Backend integration issues
- **Mitigation:** 
  - Clear API contracts defined in Week 2
  - TypeScript for type safety on both ends
  - Early testing of integration points
  - API client abstraction layer

### **Risk 4: Scope Creep**
- **Risk:** Adding too many features beyond original requirements
- **Mitigation:** 
  - Clear requirements documentation from Week 1
  - Regular team reviews of scope
  - Maintain TODO list for deferred features
  - Prioritize demo-critical features

### **Risk 5: Database Performance**
- **Risk:** SQLite may have limitations for complex queries
- **Mitigation:** 
  - Proper indexing on searchable fields
  - Query optimization
  - Database design review
  - Can scale to PostgreSQL if needed

---

## 📝 Notes

### **Week 1 Outcomes:**
- Successfully understood the real estate lead matching problem
- Identified key stakeholders: Buyers, Sellers, Admins
- Defined core features: matching, state management, audit logging
- Team aligned on project vision

### **Week 2 Outcomes:**
- Technology decisions made with team consensus
- Roles clearly defined based on individual strengths
- Architecture designed with clean separation of concerns
- SQLite chosen for simplicity and portability
- Development environment set up for all team members

### **Week 3 Progress:**
- Backend development progressing well with SQLite
- Prisma ORM simplifying database operations
- Matching algorithm implemented with weighted scoring
- State machine handling lead lifecycle
- APIs tested and working
- Ready to begin frontend development

### **Key Decisions:**
1. **SQLite over PostgreSQL:** Simpler setup, file-based, sufficient for prototype
2. **Monorepo structure:** Frontend and backend in same repo for easier coordination
3. **TypeScript everywhere:** Type safety reduces bugs
4. **Rule-based matching first:** Simpler than ML, sufficient for demo

### **Lessons Learned:**
- Early design phase (Week 2) paying off in implementation
- Clear role assignment prevents conflicts
- Regular team coordination essential
- Technology choices should balance power and simplicity

### **Next Steps:**
- Focus on frontend development in remaining Week 3 and Week 4
- Integrate frontend with completed backend
- Prepare comprehensive demo
- Gather client feedback for any final adjustments

---

**Document Owner:** Rakshit Aggarwal  
**Last Updated:** February 8, 2026  
**Status:** Living document - updated weekly
