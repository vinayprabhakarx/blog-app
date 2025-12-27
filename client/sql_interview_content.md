# Top 200 SQL Interview Questions and Answers (2025 Comprehensive Guide)

> **Top 200+ SQL Interview Questions & Answers (2025).** The ultimate cheatsheet with concise explanations, code snippets, and diagrams to crack your SQL interview.

## Table of Contents

<details>
<summary><strong>Section 1: Database Fundamentals (Q1-Q10)</strong></summary>

1. [What is a Database?](#q1-what-is-a-database)
2. [What is DBMS?](#q2-what-is-dbms)
3. [What is SQL?](#q3-what-is-sql)
4. [What is RDBMS?](#q4-what-is-rdbms)
5. [What is a Database Table?](#q5-what-is-a-database-table)
6. [What is a Query?](#q6-what-is-a-query)
7. [What is a Subquery?](#q7-what-is-a-subquery)
8. [What are the Types of Subquery?](#q8-what-are-the-types-of-subquery)
9. [What is Database Normalization?](#q9-what-is-database-normalization)
10. [What are Database Normalization Forms?](#q10-what-are-database-normalization-forms)

</details>

<details>
<summary><strong>Section 2: Keys and Constraints (Q11-Q20)</strong></summary>

11. [What is a Primary Key?](#q11-what-is-a-primary-key)
12. [What is a Foreign Key?](#q12-what-is-a-foreign-key)
13. [What is a Unique Key?](#q13-what-is-a-unique-key)
14. [What is a Candidate Key?](#q14-what-is-a-candidate-key)
15. [Difference between Primary Key and Unique Key?](#q15-difference-between-primary-key-and-unique-key)
16. [What is a Composite Key?](#q16-what-is-a-composite-key)
17. [What are Constraints in SQL?](#q17-what-are-constraints-in-sql)
18. [What is a Check Constraint?](#q18-what-is-a-check-constraint)
19. [What is a Default Constraint?](#q19-what-is-a-default-constraint)
20. [What is NOT NULL Constraint?](#q20-what-is-not-null-constraint)

</details>

<details>
<summary><strong>Section 3: Indexes (Q21-Q30)</strong></summary>

21. [What is an Index?](#q21-what-is-an-index)
22. [Why do we need Indexes?](#q22-why-do-we-need-indexes)
23. [What are the Types of Indexes?](#q23-what-are-the-types-of-indexes)
24. [What is a Clustered Index?](#q24-what-is-a-clustered-index)
25. [What is a Non-Clustered Index?](#q25-what-is-a-non-clustered-index)
26. [Difference between Clustered and Non-Clustered Index?](#q26-difference-between-clustered-and-non-clustered-index)
27. [What is a Unique Index?](#q27-what-is-a-unique-index)
28. [What is a Composite Index?](#q28-what-is-a-composite-index)
29. [When should you create an Index?](#q29-when-should-you-create-an-index)
30. [What is Index Selectivity?](#q30-what-is-index-selectivity)

</details>

<details>
<summary><strong>Section 4: Joins (Q31-Q45)</strong></summary>

31. [What is a Join in SQL?](#q31-what-is-a-join-in-sql)
32. [What are Different Types of Joins?](#q32-what-are-different-types-of-joins)
33. [What is an Inner Join?](#q33-what-is-an-inner-join)
34. [What is a Left Outer Join?](#q34-what-is-a-left-outer-join)
35. [What is a Right Outer Join?](#q35-what-is-a-right-outer-join)
36. [What is a Full Outer Join?](#q36-what-is-a-full-outer-join)
37. [What is a Self Join?](#q37-what-is-a-self-join)
38. [What is a Cross Join?](#q38-what-is-a-cross-join)
39. [What is the difference between Inner Join and Outer Join?](#q39-what-is-the-difference-between-inner-join-and-outer-join)
40. [Can you join more than two tables?](#q40-can-you-join-more-than-two-tables)
41. [What is the default Join type?](#q41-what-is-the-default-join-type)
42. [What is Natural Join?](#q42-what-is-natural-join)
43. [Difference between Join and Union?](#q43-difference-between-join-and-union)
44. [What is Equi Join?](#q44-what-is-equi-join)
45. [What is Non-Equi Join?](#q45-what-is-non-equi-join)

</details>

<details>
<summary><strong>Section 5: Stored Procedures and Functions (Q46-Q60)</strong></summary>

46. [What is a Stored Procedure?](#q46-what-is-a-stored-procedure)
47. [Why use Stored Procedures?](#q47-why-use-stored-procedures)
48. [What is a Function in SQL?](#q48-what-is-a-function-in-sql)
49. [Types of Functions?](#q49-types-of-functions)
50. [Difference between Stored Procedure and Function?](#q50-difference-between-stored-procedure-and-function)
51. [What are Scalar Functions?](#q51-what-are-scalar-functions)
52. [What are Aggregate Functions?](#q52-what-are-aggregate-functions)
53. [What are User-Defined Functions?](#q53-what-are-user-defined-functions)
54. [Types of User-Defined Functions?](#q54-types-of-user-defined-functions)
55. [What is a Table-Valued Function?](#q55-what-is-a-table-valued-function)
56. [Can we call a Stored Procedure from Function?](#q56-what-is-a-stored-procedure-from-function)
57. [What are Input and Output Parameters?](#q57-what-are-input-and-output-parameters)
58. [What is Return Statement in Stored Procedure?](#q58-what-is-return-statement-in-stored-procedure)
59. [Can Stored Procedures be nested?](#q59-can-stored-procedures-be-nested)
60. [What is a Recursive Stored Procedure?](#q60-what-is-a-recursive-stored-procedure)

</details>

<details>
<summary><strong>Section 6: Triggers (Q61-Q70)</strong></summary>

61. [What is a Trigger?](#q61-what-is-a-trigger)
62. [Why do we need Triggers?](#q62-why-do-we-need-triggers)
63. [Types of Triggers?](#q63-types-of-triggers)
64. [What is a DML Trigger?](#q64-what-is-a-dml-trigger)
65. [What is a DDL Trigger?](#q65-what-is-a-ddl-trigger)
66. [What is an INSTEAD OF Trigger?](#q66-what-is-an-instead-of-trigger)
67. [What is an AFTER Trigger?](#q67-what-is-an-after-trigger)
68. [Difference between Trigger and Stored Procedure?](#q68-difference-between-trigger-and-stored-procedure)
69. [Can we have multiple triggers on a table?](#q69-can-we-have-multiple-triggers-on-a-table)
70. [What are INSERTED and DELETED tables?](#q70-what-are-inserted-and-deleted-tables)

</details>

<details>
<summary><strong>Section 7: Views (Q71-Q80)</strong></summary>

71. [What is a View?](#q71-what-is-a-view)
72. [Why use Views?](#q72-why-use-views)
73. [Types of Views?](#q73-types-of-views)
74. [What is a Simple View?](#q74-what-is-a-simple-view)
75. [What is a Complex View?](#q75-what-is-a-complex-view)
76. [What is a Materialized View?](#q76-what-is-a-materialized-view)
77. [Can we insert data through Views?](#q77-can-we-insert-data-through-views)
78. [What is WITH CHECK OPTION?](#q78-what-is-with-check-option)
79. [Can we create Index on Views?](#q79-can-we-create-index-on-views)
80. [Difference between View and Table?](#q80-difference-between-view-and-table)

</details>

<details>
<summary><strong>Section 8: Transactions and Locking (Q81-Q95)</strong></summary>

81. [What is a Transaction?](#q81-what-is-a-transaction)
82. [What is ACID Property?](#q82-what-is-acid-property)
83. [What is COMMIT?](#q83-what-is-commit)
84. [What is ROLLBACK?](#q84-what-is-rollback)
85. [What is SAVEPOINT?](#q85-what-is-savepoint)
86. [What are Transaction Isolation Levels?](#q86-what-are-transaction-isolation-levels)
87. [What is READ UNCOMMITTED?](#q87-what-is-read-uncommitted)
88. [What is READ COMMITTED?](#q88-what-is-read-committed)
89. [What is REPEATABLE READ?](#q89-what-is-repeatable-read)
90. [What is SERIALIZABLE?](#q90-what-is-serializable)
91. [What is Locking?](#q91-what-is-locking)
92. [Types of Locks?](#q92-types-of-locks)
93. [What is Deadlock?](#q93-what-is-deadlock)
94. [What is Lock Escalation?](#q94-what-is-lock-escalation)
95. [What are Dirty Reads, Non-Repeatable Reads, and Phantom Reads?](#q95-what-are-dirty-reads-non-repeatable-reads-and-phantom-reads)

</details>

<details>
<summary><strong>Section 9: SQL Commands and Clauses (Q96-Q115)</strong></summary>

96. [Difference between DELETE and TRUNCATE?](#q96-difference-between-delete-and-truncate)
97. [Difference between DROP and TRUNCATE?](#q97-difference-between-drop-and-truncate)
98. [Difference between WHERE and HAVING?](#q98-difference-between-where-and-having)
99. [What is GROUP BY clause?](#q99-what-is-group-by-clause)
100. [What is ORDER BY clause?](#q100-what-is-order-by-clause)
101. [Difference between UNION and UNION ALL?](#q101-difference-between-union-and-union-all)
102. [What is INTERSECT?](#q102-what-is-intersect)
103. [What is EXCEPT/MINUS?](#q103-what-is-except-minus)
104. [What is the CASE statement?](#q104-what-is-the-case-statement)
105. [What is COALESCE function?](#q105-what-is-coalesce-function)
106. [What is NULLIF function?](#q106-what-is-nullif-function)
107. [What are Wildcard operators?](#q107-what-are-wildcard-operators)
108. [What is LIKE operator?](#q108-what-is-like-operator)
109. [What is IN operator?](#q109-what-is-in-operator)
110. [What is BETWEEN operator?](#q110-what-is-between-operator)
111. [What is EXISTS operator?](#q111-what-is-exists-operator)
112. [What is ALL operator?](#q112-what-is-all-operator)
113. [What is ANY operator?](#q113-what-is-any-operator)
114. [What is DISTINCT keyword?](#q114-what-is-distinct-keyword)
115. [What is TOP/LIMIT clause?](#q115-what-is-top-limit-clause)

</details>

<details>
<summary><strong>Section 10: Data Types and Functions (Q116-Q130)</strong></summary>

116. [What are SQL Data Types?](#q116-what-are-sql-data-types)
117. [Difference between CHAR and VARCHAR?](#q117-difference-between-char-and-varchar)
118. [What is NVARCHAR?](#q118-what-is-nvarchar)
119. [Difference between VARCHAR and NVARCHAR?](#q119-difference-between-varchar-and-nvarchar)
120. [What are Date and Time Data Types?](#q120-what-are-date-and-time-data-types)
121. [What is DATETIME vs DATETIME2?](#q121-what-is-datetime-vs-datetime2)
122. [What are String Functions?](#q122-what-are-string-functions)
123. [What is SUBSTRING function?](#q123-what-is-substring-function)
124. [What is CHARINDEX function?](#q124-what-is-charindex-function)
125. [What is STUFF function?](#q125-what-is-stuff-function)
126. [What is REPLACE function?](#q126-what-is-replace-function)
127. [Difference between STUFF and REPLACE?](#q127-difference-between-stuff-and-replace)
128. [What are Date Functions?](#q128-what-are-date-functions)
129. [What is DATEADD function?](#q129-what-is-dateadd-function)
130. [What is DATEDIFF function?](#q130-what-is-datediff-function)

</details>

<details>
<summary><strong>Section 11: Performance and Optimization (Q131-Q145)</strong></summary>

131. [How to improve SQL query performance?](#q131-how-to-improve-sql-query-performance)
132. [What is Query Execution Plan?](#q132-what-is-query-execution-plan)
133. [What is SQL Profiler?](#q133-what-is-sql-profiler)
134. [What is Denormalization?](#q134-what-is-denormalization)
135. [What is Partitioning?](#q135-what-is-partitioning)
136. [What is a Covering Index?](#q136-what-is-a-covering-index)
137. [What is Index Scan vs Index Seek?](#q137-what-is-index-scan-vs-index-seek)
138. [What is Statistics in SQL Server?](#q138-what-is-statistics-in-sql-server)
139. [What is UPDATE_STATISTICS?](#q139-what-is-update-statistics)
140. [What is Fill Factor?](#q140-what-is-fill-factor)
141. [What is Page Split?](#q141-what-is-page-split)
142. [What are Hints in SQL Server?](#q142-what-are-hints-in-sql-server)
143. [What is Query Optimization?](#q143-what-is-query-optimization)
144. [What is Cost-Based Optimization?](#q144-what-is-cost-based-optimization)
145. [What is Parallel Query Execution?](#q145-what-is-parallel-query-execution)

</details>

<details>
<summary><strong>Section 12: Advanced Topics (Q146-Q165)</strong></summary>

146. [What is a Cursor?](#q146-what-is-a-cursor)
147. [Types of Cursors?](#q147-types-of-cursors)
148. [Why avoid Cursors?](#q148-why-avoid-cursors)
149. [What is CTE (Common Table Expression)?](#q149-what-is-cte-common-table-expression)
150. [What is a Recursive CTE?](#q150-what-is-a-recursive-cte)
151. [What are Temporary Tables?](#q151-what-are-temporary-tables)
152. [What are Table Variables?](#q152-what-are-table-variables)
153. [Difference between Temp Table and Table Variable?](#q153-difference-between-temp-table-and-table-variable)
154. [What is Dynamic SQL?](#q154-what-is-dynamic-sql)
155. [What is SQL Injection?](#q155-what-is-sql-injection)
156. [How to prevent SQL Injection?](#q156-how-to-prevent-sql-injection)
157. [What is Collation?](#q157-what-is-collation)
158. [What is Schema?](#q158-what-is-schema)
159. [What are Synonyms?](#q159-what-are-synonyms)
160. [What is a Sequence?](#q160-what-is-a-sequence)
161. [What is IDENTITY column?](#q161-what-is-identity-column)
162. [Difference between @@IDENTITY and SCOPE_IDENTITY?](#q162-difference-between-identity-and-scope-identity)
163. [What is IDENT_CURRENT?](#q163-what-is-ident-current)
164. [What are System Functions?](#q164-what-are-system-functions)
165. [What is @@ROWCOUNT?](#q165-what-is-rowcount)

</details>

<details>
<summary><strong>Section 13: SQL Server Specific (Q166-Q180)</strong></summary>

166. [What is OLTP?](#q166-what-is-oltp)
167. [What is OLAP?](#q167-what-is-olap)
168. [Difference between OLTP and OLAP?](#q168-difference-between-oltp-and-olap)
169. [What is Data Warehouse?](#q169-what-is-data-warehouse)
170. [What are Fact and Dimension Tables?](#q170-what-are-fact-and-dimension-tables)
171. [What is Star Schema?](#q171-what-is-star-schema)
172. [What is Snowflake Schema?](#q172-what-is-snowflake-schema)
173. [What is Replication?](#q173-what-is-replication)
174. [Types of Replication?](#q174-types-of-replication)
175. [What is BCP Utility?](#q175-what-is-bcp-utility)
176. [What is SSIS?](#q176-what-is-ssis)
177. [What is SSRS?](#q177-what-is-ssrs)
178. [What is SSAS?](#q178-what-is-ssas)
179. [What is Linked Server?](#q179-what-is-linked-server)
180. [What is DBCC?](#q180-what-is-dbcc)

</details>

<details>
<summary><strong>Section 14: Practical SQL Queries (Q181-Q200)</strong></summary>

181. [Find Second Highest Salary](#q181-find-second-highest-salary)
182. [Find Nth Highest Salary](#q182-find-nth-highest-salary)
183. [Find Duplicate Records](#q183-find-duplicate-records)
184. [Delete Duplicate Records](#q184-delete-duplicate-records)
185. [Find Employees with Same Salary](#q185-find-employees-with-same-salary)
186. [Display Odd Rows](#q186-display-odd-rows)
187. [Display Even Rows](#q187-display-even-rows)
188. [Find Employees Who Are Also Managers](#q188-find-employees-who-are-also-managers)
189. [Display Employee Name and Manager Name](#q189-display-employee-name-and-manager-name)
190. [Find Departments with No Employees](#q190-find-departments-with-no-employees)
191. [Find Employees Earning More Than Their Managers](#q191-find-employees-earning-more-than-their-managers)
192. [Find Students Scoring Above Average](#q192-find-students-scoring-above-average)
193. [Display Current Date and Time](#q193-display-current-date-and-time)
194. [Calculate Age from Date of Birth](#q194-calculate-age-from-date-of-birth)
195. [Find Max Salary from Each Department](#q195-find-max-salary-from-each-department)
196. [Display Row Numbers](#q196-display-row-numbers)
197. [Transpose Rows to Columns](#q197-transpose-rows-to-columns)
198. [Generate Running Total](#q198-generate-running-total)
199. [Find Consecutive Records](#q199-find-consecutive-records)
200. [String Concatenation from Multiple Rows](#q200-string-concatenation-from-multiple-rows)

</details>
