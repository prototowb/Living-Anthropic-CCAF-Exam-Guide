export const quizSections = [
  {
    id: 's1',
    title: 'Claude Code for Continuous Integration',
    shortTitle: 'CI/CD Integration',
    context:
      'You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives.',
    color: '#e88c30',
    questions: [
      {
        id: 1,
        text: 'Your CI/CD system performs three types of Claude-powered analysis: (1) quick style checks on each PR that block merging until complete, (2) comprehensive security audits of the entire codebase run weekly, and (3) test case generation triggered nightly for recently-modified modules. The Message Batches API offers 50% cost savings but can take up to 24 hours to process. You want to optimize API costs while maintaining acceptable developer experience. Which combination correctly matches each task to its API approach?',
        options: [
          {
            letter: 'A',
            text: 'Use synchronous calls for PR style checks; use the Message Batches API for weekly security audits and nightly test generation.',
          },
          {
            letter: 'B',
            text: 'Use synchronous calls for PR style checks and nightly test generation; use Message Batches API only for weekly security audits.',
          },
          {
            letter: 'C',
            text: 'Use synchronous calls for all three tasks for consistent response times, and rely on prompt caching to reduce costs across all workloads.',
          },
          {
            letter: 'D',
            text: 'Use the Message Batches API for all three tasks to maximize the 50% cost savings, and configure the pipeline to poll for batch completion.',
          },
        ],
        correct: 'A',
        explanation:
          'This is the correct approach. PR style checks block developers and require immediate responses via synchronous calls, while weekly security audits and nightly test generation are scheduled tasks with flexible timelines that can easily tolerate the up-to-24-hour batch processing window, capturing the 50% cost savings on both.',
        wrongExplanations: {
          B: 'While correctly using synchronous calls for latency-sensitive PR checks, this approach misses the 50% cost savings on nightly test generation, which runs on a scheduled basis and can easily tolerate batch processing times. There is no reason to pay full price for a task that doesn\'t need immediate results.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Batch Processing concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.5',
      },
      {
        id: 2,
        text: 'Your automated review analyzes comments and docstrings. The current prompt instructs Claude to "check that comments are accurate and up-to-date." Findings frequently flag acceptable patterns (TODO markers, straightforward descriptions) while missing comments that describe behavior the code no longer implements. What change addresses the root cause of this inconsistent analysis?',
        options: [
          {
            letter: 'A',
            text: 'Add few-shot examples of misleading comments to help the model recognize similar patterns in the codebase',
          },
          {
            letter: 'B',
            text: 'Specify explicit criteria: flag comments only when their claimed behavior contradicts actual code behavior',
          },
          {
            letter: 'C',
            text: 'Include git blame data so Claude can identify comments that predate recent code modifications',
          },
          {
            letter: 'D',
            text: 'Filter out TODO, FIXME, and descriptive comment patterns before analysis to reduce noise',
          },
        ],
        correct: 'B',
        explanation:
          'Specifying explicit criteria—flag comments only when their claimed behavior contradicts actual code behavior—directly addresses the root cause by replacing the vague instruction with a precise definition of what constitutes a problem. This eliminates both false positives on acceptable patterns and false negatives on genuinely misleading comments.',
      },
      {
        id: 3,
        text: 'Analysis of your automated code review shows significant variation in false positive rates across finding categories. Security and correctness findings have an 8% false positive rate, performance findings have 18%, style and naming findings have 52%, and documentation findings have 48%.\n\nDeveloper surveys indicate growing distrust—many have started dismissing findings without review because "half are wrong." The high false positive categories are undermining confidence in the accurate categories. What approach best restores developer trust while improving the system?',
        options: [
          {
            letter: 'A',
            text: 'Keep all categories enabled while adding few-shot examples to improve each category\'s accuracy over the coming weeks.',
          },
          {
            letter: 'B',
            text: 'Apply a uniform strictness reduction across all categories to bring the overall false positive rate to an acceptable level.',
          },
          {
            letter: 'C',
            text: 'Keep all categories but display a confidence score with each finding, letting developers decide which to investigate.',
          },
          {
            letter: 'D',
            text: 'Temporarily disable high false positive categories (style, naming, documentation) and run only high-precision categories while improving prompts.',
          },
        ],
        correct: 'D',
        explanation:
          'Temporarily disabling the high false positive categories (style, naming, documentation) immediately stops trust erosion by removing the noise that causes developers to dismiss all findings, while preserving the value of high-precision categories like security and correctness. This approach allows time to improve prompts for the problematic categories before re-enabling them, rebuilding trust through demonstrated accuracy.',
      },
      {
        id: 4,
        text: 'The code review component works iteratively: Claude analyzes a changed file, then may request related files (imports, base classes, tests) via tool calling to understand context before providing final feedback. Your application defines a tool that lets Claude request file contents; Claude invokes this tool, receives results, and continues its analysis. You\'re evaluating batch processing to reduce API costs.\n\nWhat is the primary technical constraint when considering batch processing for this workflow?',
        options: [
          {
            letter: 'A',
            text: 'The batch API doesn\'t support tool definitions in request parameters.',
          },
          {
            letter: 'B',
            text: 'The asynchronous model prevents executing tools mid-request and returning results for Claude to continue analysis.',
          },
          {
            letter: 'C',
            text: 'Batch processing lacks request correlation identifiers for matching outputs to input requests.',
          },
          {
            letter: 'D',
            text: 'Batch processing latency of up to 24 hours is too slow for pull request feedback, though the workflow could otherwise function.',
          },
        ],
        correct: 'B',
        explanation:
          'This is correct. The batch API\'s asynchronous fire-and-forget model means there is no mechanism to intercept a tool call mid-request, execute the tool, and return results for Claude to continue its analysis. This fundamentally breaks iterative tool-calling workflows that require multiple rounds of tool invocation and response within a single logical interaction.',
        wrongExplanations: {
          D: 'While the up-to-24-hour latency is a real practical concern, the claim that the workflow could otherwise function is incorrect. The fundamental architectural limitation is that batch processing cannot support the iterative tool-calling loop this workflow requires, regardless of how fast results are returned.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Batch Processing concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.5',
      },
      {
        id: 5,
        text: 'Your CI pipeline includes two Claude-powered code review modes: a pre-merge-commit hook that blocks PR merging until complete, and "deep analysis" that runs overnight, polls for batch completion, then posts detailed suggestions to the PR. You want to reduce API costs using the Message Batches API, which offers 50% cost savings but requires polling and may take up to 24 hours to complete. Which mode should use batch processing?',
        options: [
          { letter: 'A', text: 'Deep analysis only' },
          { letter: 'B', text: 'Neither mode' },
          { letter: 'C', text: 'Both modes' },
          { letter: 'D', text: 'Pre-merge-commit hook only' },
        ],
        correct: 'A',
        explanation:
          'Deep analysis is the ideal candidate for batch processing because it already runs overnight, tolerates latency, and uses a polling model to check for completion before posting results—perfectly matching the Message Batches API\'s asynchronous, poll-based design while capturing the 50% cost savings.',
      },
      {
        id: 6,
        text: 'Your CI pipeline runs the Claude Code CLI (with --print mode) using CLAUDE.md to provide project context for code reviews, and developers generally find the reviews insightful. However, they report that integrating findings into your workflow is difficult—Claude produces narrative paragraphs that must be manually copied into PR comments. Your team wants to automatically post each finding as a separate inline PR comment at the relevant code location, which requires structured data with file path, line number, severity, and suggested fix. What\'s the most effective approach?',
        options: [
          {
            letter: 'A',
            text: 'Include explicit formatting instructions in your review prompt requiring each finding to follow a parseable template like [FILE:path] [LINE:n] [SEVERITY:level] ....',
          },
          {
            letter: 'B',
            text: 'Keep the narrative review format but add a summarization step that uses Claude to generate a structured JSON summary of the findings.',
          },
          {
            letter: 'C',
            text: 'Add a "Review Output Format" section to CLAUDE.md with examples showing structured findings, so Claude learns the expected format from project context.',
          },
          {
            letter: 'D',
            text: 'Use CLI flags --output-format json and --json-schema to enforce structured findings, then parse output to post inline comments via the GitHub API.',
          },
        ],
        correct: 'D',
        explanation:
          'Using `--output-format json` with `--json-schema` enforces structured output at the CLI level, guaranteeing well-formed JSON with the required fields (file path, line number, severity, suggested fix) that can be reliably parsed and posted as inline PR comments via the GitHub API. This is the most effective approach because it leverages native CLI capabilities designed specifically for structured output enforcement.',
      },
      {
        id: 7,
        text: 'Your automated review generates test case suggestions for each PR. When reviewing a PR that adds course completion tracking, Claude suggests 10 test cases but developer feedback indicates 6 duplicate scenarios already covered in the existing test suite. What change would most effectively reduce duplicate suggestions?',
        options: [
          {
            letter: 'A',
            text: 'Implement post-processing that filters suggestions whose descriptions match keywords from existing test names',
          },
          {
            letter: 'B',
            text: 'Add instructions directing Claude to focus exclusively on edge cases and error conditions rather than successful paths',
          },
          {
            letter: 'C',
            text: 'Reduce requested suggestions from 10 to 5, assuming Claude will prioritize the most valuable cases first',
          },
          {
            letter: 'D',
            text: 'Include the existing test file in the context so Claude can identify what scenarios are already covered',
          },
        ],
        correct: 'D',
        explanation:
          'Including the existing test file in the context directly addresses the root cause of duplication: Claude can only avoid suggesting already-covered scenarios if it knows what tests already exist. This gives Claude the information needed to reason about which suggestions would be genuinely new and valuable.',
        wrongExplanations: {
          A: 'Using keyword matching to filter suggestions is a brittle approach that would miss semantically equivalent tests described with different wording or terminology. This post-processing workaround addresses symptoms rather than the root cause and would be unreliable in practice.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Context Provision Methods concepts in the exam study guide.',
        studyAreaLink: '/domains/d5#task-5.1',
      },
      {
        id: 8,
        text: 'Your pipeline script runs claude "Analyze this pull request for security issues" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What\'s the correct approach to run Claude Code in an automated pipeline?',
        options: [
          {
            letter: 'A',
            text: 'Add the -p flag: claude -p "Analyze this pull request for security issues"',
          },
          {
            letter: 'B',
            text: 'Set the environment variable CLAUDE_HEADLESS=true before running the command',
          },
          {
            letter: 'C',
            text: 'Redirect stdin from /dev/null: claude "Analyze this pull request for security issues" < /dev/null',
          },
          {
            letter: 'D',
            text: 'Add the --batch flag: claude --batch "Analyze this pull request for security issues"',
          },
        ],
        correct: 'A',
        explanation:
          'The `-p` (or `--print`) flag is the documented way to run Claude Code in non-interactive mode. It processes the given prompt, outputs the result to stdout, and exits without waiting for user input, making it ideal for CI/CD pipelines.',
      },
      {
        id: 9,
        text: 'Your automated reviews identify valid issues but developers report the feedback isn\'t actionable. Findings say things like "complex ticket allocation logic" or "potential null pointer" without specifying what to change. When you add detailed instructions like "always include specific fix suggestions," the model still produces inconsistent output—sometimes detailed, sometimes vague. What prompting technique would most reliably produce consistently actionable feedback?',
        options: [
          {
            letter: 'A',
            text: 'Add 3-4 few-shot examples showing the exact format you want: issue identified, code location, specific fix suggestion',
          },
          {
            letter: 'B',
            text: 'Implement a two-pass approach where one prompt identifies issues and a second prompt generates fixes, allowing specialization',
          },
          {
            letter: 'C',
            text: 'Further refine the instructions with more explicit requirements for each part of the feedback format (location, issue, severity, suggested fix)',
          },
          {
            letter: 'D',
            text: 'Expand the context window to include more of the surrounding codebase so the model has sufficient information to suggest specific fixes',
          },
        ],
        correct: 'A',
        explanation:
          'Few-shot examples are the most effective technique for achieving consistent output format when instructions alone produce variable results. Providing 3-4 examples showing the exact desired format (issue, location, specific fix) gives the model a concrete pattern to follow, which is more reliable than abstract instructions.',
        wrongExplanations: {
          C: 'The scenario already describes adding detailed instructions that failed to produce consistent output, so further refining instructions repeats the same failing approach. More explicit requirements are still abstract instructions, which models follow less reliably than concrete examples.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Few-Shot Prompting concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.2',
      },
      {
        id: 10,
        text: 'Your team uses Claude Code to generate code suggestions, but you notice a pattern: subtle issues—performance optimizations that break edge cases, cleanups that change behavior unexpectedly—only surface when a different team member reviews the PR. Claude\'s reasoning during generation shows it considered these cases but concluded its approach was correct. Which approach directly addresses the root cause of this self-review limitation?',
        options: [
          {
            letter: 'A',
            text: 'Have a second, independent Claude Code instance review the changes without seeing the generator\'s reasoning.',
          },
          {
            letter: 'B',
            text: 'Include comprehensive test files and documentation in the prompt context so Claude better understands expected behavior during generation.',
          },
          {
            letter: 'C',
            text: 'Enable extended thinking mode for the generation pass, allowing more thorough deliberation before producing suggestions.',
          },
          {
            letter: 'D',
            text: 'Add explicit self-review instructions to the generation prompt, asking Claude to critique its own suggestions before finalizing output.',
          },
        ],
        correct: 'A',
        explanation:
          'Using a second, independent Claude Code instance without access to the generator\'s reasoning directly addresses the root cause by eliminating confirmation bias. This fresh perspective mirrors the benefit of human peer review, where a different team member catches issues the original author rationalized away.',
        wrongExplanations: {
          D: 'Asking Claude to critique its own suggestions within the same context does not address the root cause, because the same confirmation bias that led it to conclude its approach was correct will persist during self-review. The question explicitly states Claude already considered these cases and rationalized its decisions, so additional self-critique in the same context will likely reach the same conclusions.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Multi-Instance Verification concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.6',
      },
      {
        id: 11,
        text: 'Your automated code review averages 15 findings per pull request, with developers reporting a 40% false positive rate. The bottleneck is investigation time: developers must click into each finding to read Claude\'s reasoning before deciding whether to address or dismiss it. Your CLAUDE.md already contains comprehensive rules for acceptable patterns, and stakeholders have rejected any approach that filters findings before developer review. What change would best address the investigation time bottleneck?',
        options: [
          {
            letter: 'A',
            text: 'Require Claude to include its reasoning and confidence assessment inline with each finding',
          },
          {
            letter: 'B',
            text: 'Add a post-processor that analyzes finding patterns and automatically suppresses those matching historical false positive signatures',
          },
          {
            letter: 'C',
            text: 'Configure Claude to only surface findings it assesses as high confidence, filtering out uncertain flags before developers see them',
          },
          {
            letter: 'D',
            text: 'Categorize findings as "blocking issues" versus "suggestions" with tiered review requirements',
          },
        ],
        correct: 'A',
        explanation:
          'Including reasoning and confidence assessments inline with each finding directly addresses the investigation time bottleneck by allowing developers to quickly evaluate findings without clicking into each one separately. This approach respects the constraint against filtering, since all findings remain visible while making triage significantly faster.',
        wrongExplanations: {
          D: 'Categorizing findings into tiers reorganizes the review workflow but does not reduce the core investigation time problem, as developers still need to click into each finding to understand Claude\'s reasoning before deciding to address or dismiss it. This approach adds structure without addressing the root cause of the bottleneck.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review False Positive Reduction concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.2',
      },
      {
        id: 12,
        text: 'Your automated code review system shows inconsistent severity ratings—similar issues like null pointer risks receive "critical" severity in some PRs but only "medium" in others. Developer trust is declining because teams can\'t predict which findings require immediate attention. What\'s the most effective way to improve severity consistency?',
        options: [
          {
            letter: 'A',
            text: 'Request that Claude include its reasoning for each severity assignment, then use that reasoning to manually calibrate and adjust ratings during review',
          },
          {
            letter: 'B',
            text: 'Include explicit severity criteria in your prompt with concrete code examples for each severity level',
          },
          {
            letter: 'C',
            text: 'Modify the prompt to ask Claude to rate severity relative to other issues in the same PR, so the most severe issue is always marked critical and others rated proportionally',
          },
          {
            letter: 'D',
            text: 'Add a CLAUDE.md file that lists issue types and their default severities, instructing Claude to reference this mapping when assigning ratings',
          },
        ],
        correct: 'B',
        explanation:
          'Including explicit severity criteria with concrete code examples directly addresses the root cause of inconsistency by removing ambiguity about what each severity level means. This is a proven prompt engineering technique that gives the model clear reference points for classification, leading to more reliable and predictable severity assignments.',
        wrongExplanations: {
          D: 'A static issue-type-to-severity mapping loses important context, since the same issue type (e.g., a null pointer risk) may warrant different severities depending on factors like code path, exposure, or criticality of the affected component. This rigid approach oversimplifies severity assignment and can lead to inaccurate ratings.',
        },
        studyArea:
          'Claude Code for Continuous Integration — review Classification Consistency concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.2',
      },
      {
        id: 13,
        text: 'After an initial automated review generates 12 findings, a developer pushes new commits to address the issues. When the review runs again, it produces 8 findings—but developers report that 5 duplicate earlier comments on code that was already fixed in the new commits. What\'s the most effective way to eliminate this redundant feedback while maintaining thorough analysis?',
        options: [
          {
            letter: 'A',
            text: 'Include prior review findings in context, instructing Claude to only report new or still-unaddressed issues.',
          },
          {
            letter: 'B',
            text: 'Add a post-processing filter that removes findings matching previous file paths and issue descriptions before posting comments.',
          },
          {
            letter: 'C',
            text: 'Restrict the review scope to only files modified in the most recent push, excluding files from earlier commits.',
          },
          {
            letter: 'D',
            text: 'Run reviews only on initial PR creation and final pre-merge state, skipping intermediate commits.',
          },
        ],
        correct: 'A',
        explanation:
          'Including prior review findings in context allows Claude to intelligently distinguish between new issues and those already addressed by recent commits. This approach maintains thorough analysis while leveraging Claude\'s reasoning ability to avoid redundant feedback on fixed code.',
      },
      {
        id: 14,
        text: 'Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?',
        options: [
          {
            letter: 'A',
            text: 'Switch both workflows to batch processing with status polling to check for completion.',
          },
          {
            letter: 'B',
            text: 'Switch both to batch processing with a timeout fallback to real-time if batches take too long.',
          },
          {
            letter: 'C',
            text: 'Keep real-time calls for both workflows to avoid batch result ordering issues.',
          },
          {
            letter: 'D',
            text: 'Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.',
          },
        ],
        correct: 'D',
        explanation:
          'This is the correct approach because the Message Batches API\'s up to 24-hour processing time with no guaranteed latency SLA makes it ideal for overnight technical debt reports but unsuitable for blocking pre-merge checks where developers are waiting. This matches each workflow to the appropriate API based on its latency requirements.',
      },
      {
        id: 15,
        text: 'A pull request modifies 14 files across the stock tracking module. Your single-pass review analyzing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback—flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?',
        options: [
          {
            letter: 'A',
            text: 'Split into focused passes: analyze each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.',
          },
          {
            letter: 'B',
            text: 'Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs.',
          },
          {
            letter: 'C',
            text: 'Require developers to split large PRs into smaller submissions of 3-4 files before the automated review runs.',
          },
          {
            letter: 'D',
            text: 'Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.',
          },
        ],
        correct: 'A',
        explanation:
          'Splitting the review into focused per-file passes directly addresses the root cause of attention dilution, ensuring consistent depth and catching local issues reliably. A separate integration-focused pass then handles cross-file concerns like data flow dependencies, covering both dimensions of review quality.',
      },
    ],
  },
  {
    id: 's2',
    title: 'Customer Support Resolution Agent',
    shortTitle: 'Support Agent',
    context:
      'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.',
    color: '#1E728C',
    questions: [
      {
        id: 1,
        text: 'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.\n\nIn testing, you notice the agent frequently calls get_customer when users ask about order status, even though lookup_order would be more appropriate. What should you examine first to address this issue?',
        options: [
          {
            letter: 'A',
            text: 'Add few-shot examples covering every possible order-related query pattern to the system prompt',
          },
          {
            letter: 'B',
            text: 'Review tool descriptions to ensure they clearly distinguish each tool\'s purpose',
          },
          {
            letter: 'C',
            text: 'Implement a pre-processing classifier that detects order queries and routes directly to lookup_order',
          },
          {
            letter: 'D',
            text: 'Reduce the number of tools available to the agent to simplify selection',
          },
        ],
        correct: 'B',
        explanation:
          'Tool descriptions are the primary input the model uses to decide which tool to call. When an agent consistently selects the wrong tool, the first diagnostic step is to examine whether the tool descriptions clearly distinguish each tool\'s purpose and specify when each should be used.',
        wrongExplanations: {
          C: 'Building a separate pre-processing classifier to route queries is an over-engineered solution that bypasses the agent\'s native tool selection ability instead of fixing the underlying tool definitions that guide that selection.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Tool Selection Reliability concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.1',
      },
      {
        id: 2,
        text: 'Production data shows that in 12% of cases, your agent skips get_customer entirely and calls lookup_order using only the customer\'s stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?',
        options: [
          {
            letter: 'A',
            text: 'Enhance the system prompt to state that customer verification via get_customer is mandatory before any order operations.',
          },
          {
            letter: 'B',
            text: 'Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type.',
          },
          {
            letter: 'C',
            text: 'Add a programmatic prerequisite that blocks lookup_order and process_refund calls until get_customer has returned a verified customer ID.',
          },
          {
            letter: 'D',
            text: 'Add few-shot examples showing the agent always calling get_customer first, even when customers volunteer order details.',
          },
        ],
        correct: 'C',
        explanation:
          'Adding a programmatic prerequisite that blocks downstream tools until `get_customer` returns a verified customer ID provides a deterministic guarantee that the required sequence is followed. This is the most effective approach because it removes the possibility of the agent skipping verification, regardless of LLM behavior.',
      },
      {
        id: 3,
        text: 'Your agent handles single-concern requests with 94% accuracy (e.g., "I need a refund for order #1234"). However, when customers include multiple concerns in one message (e.g., "I need a refund for order #1234 and also want to update my shipping address for order #5678"), tool selection accuracy drops to 58%. The agent typically addresses only one concern or mixes up parameters between requests. What\'s the most effective approach to improve reliability for multi-concern requests?',
        options: [
          {
            letter: 'A',
            text: 'Implement a preprocessing layer that uses a separate model call to decompose multi-concern messages into individual requests, process each independently, then combine the results.',
          },
          {
            letter: 'B',
            text: 'Consolidate related tools into fewer, more general-purpose tools.',
          },
          {
            letter: 'C',
            text: 'Add few-shot examples to your prompt demonstrating the correct reasoning and tool sequence for multi-concern requests.',
          },
          {
            letter: 'D',
            text: 'Implement response validation that detects incomplete responses and automatically re-prompts the agent to address any missed concerns.',
          },
        ],
        correct: 'C',
        explanation:
          'Adding few-shot examples demonstrating correct reasoning and tool sequencing for multi-concern requests is the most effective approach because the agent already handles individual concerns well at 94% accuracy—it simply needs pattern guidance for handling multiple concerns in one message. This is a low-cost, proven technique that directly addresses the root cause of the agent failing to decompose and properly route parameters across multiple requests.',
        wrongExplanations: {
          A: 'Using a separate model call to decompose multi-concern messages adds unnecessary latency, complexity, and cost when the agent already demonstrates strong single-concern understanding. This over-engineers the solution when simpler prompt-level guidance can address the pattern recognition gap.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Tool Selection Reliability concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.1',
      },
      {
        id: 4,
        text: 'Production logs show that for simple requests like "refund order #1234", your agent succeeds in 3-4 tool calls with 91% resolution rate. However, for complex requests like "I\'ve been charged twice, my discount didn\'t apply, and I want to cancel", the agent averages 12+ tool calls with only 54% resolution—often investigating concerns sequentially and gathering redundant customer data for each one. What\'s the most effective change to improve complex request handling?',
        options: [
          {
            letter: 'A',
            text: 'Add explicit verification gates between steps requiring the agent to checkpoint after resolving each concern before moving to the next.',
          },
          {
            letter: 'B',
            text: 'Reduce the number of available tools by consolidating get_customer, lookup_order, and billing-related lookups into a single investigate_issue tool.',
          },
          {
            letter: 'C',
            text: 'Decompose the request into distinct concerns, then investigate each in parallel using shared customer context before synthesizing a resolution.',
          },
          {
            letter: 'D',
            text: 'Add few-shot examples demonstrating ideal tool call sequences for various multi-part billing scenarios to your system prompt.',
          },
        ],
        correct: 'C',
        explanation:
          'Decomposing the request into distinct concerns and investigating them in parallel with shared customer context directly addresses both core issues: it eliminates redundant data fetching by reusing context across concerns and reduces total tool calls by parallelizing investigations before synthesizing a unified resolution.',
        wrongExplanations: {
          A: 'Adding verification gates between sequential steps would actually worsen the problem by reinforcing the sequential processing pattern and adding overhead, rather than addressing the root cause of redundant data gathering and serial investigation.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Multi-step Workflow Orchestration concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.2',
      },
      {
        id: 5,
        text: 'Production metrics show your agent averages 4+ API round-trips per resolution. Analysis reveals Claude frequently requests get_customer and lookup_order in separate sequential turns even when both are needed upfront. What\'s the most effective way to reduce round-trips?',
        options: [
          {
            letter: 'A',
            text: 'Increase max_tokens to give Claude more space to plan ahead and naturally batch its tool requests.',
          },
          {
            letter: 'B',
            text: 'Implement speculative execution that automatically calls likely-needed tools alongside any requested tool, returning all results regardless of what was requested.',
          },
          {
            letter: 'C',
            text: 'Prompt Claude to batch tool requests per turn, and return all tool results together before the next API call.',
          },
          {
            letter: 'D',
            text: 'Create composite tools like get_customer_with_orders that bundle common lookup combinations into single calls.',
          },
        ],
        correct: 'C',
        explanation:
          'Prompting Claude to batch related tool requests in a single turn, and returning all results together before the next API call, leverages Claude\'s native ability to request multiple tools simultaneously. This is the most effective approach because it directly addresses the sequential calling pattern with minimal architectural changes.',
      },
      {
        id: 6,
        text: 'Production logs reveal a consistent pattern: when customers include "account" in messages (e.g., "I want to check my account for the order I placed yesterday"), the agent calls get_customer first 78% of the time. When customers phrase similar requests without "account" (e.g., "I want to check on the order I placed yesterday"), it calls lookup_order first 93% of the time. The tool descriptions are well-written and unambiguous. What is the most likely root cause of this discrepancy?',
        options: [
          {
            letter: 'A',
            text: 'The tool descriptions need additional negative examples specifying when NOT to use each tool to prevent this keyword-triggered confusion',
          },
          {
            letter: 'B',
            text: 'The system prompt contains keyword-sensitive instructions that steer behavior based on terms like "account," creating unintended tool selection patterns',
          },
          {
            letter: 'C',
            text: 'The model\'s base training creates associations between "account" terminology and customer-related operations that override the tool descriptions',
          },
          {
            letter: 'D',
            text: 'The model requires more training data on multi-concept messages and should be fine-tuned on examples that include both account and order language',
          },
        ],
        correct: 'B',
        explanation:
          'This is the most likely root cause because the systematic, keyword-triggered pattern (78% vs 93%) strongly suggests explicit routing logic in the system prompt that reacts to the word "account" and directs the agent toward customer-related tools. Since the tool descriptions are already well-written and unambiguous, the discrepancy points to prompt-level instructions creating unintended behavioral steering.',
        wrongExplanations: {
          A: 'Adding negative examples to tool descriptions contradicts the stated premise that the descriptions are already well-written and unambiguous. The issue is not with the tool descriptions themselves but with upstream instructions in the system prompt that override correct tool selection based on keyword triggers.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Tool Selection Reliability concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.1',
      },
      {
        id: 7,
        text: 'You\'re implementing the agentic loop for your support agent. After each API call to Claude, you need to determine whether to continue the loop (execute the requested tools and call Claude again) or stop (present the final response to the customer). What determines this decision?',
        options: [
          {
            letter: 'A',
            text: 'Parse Claude\'s response text for phrases like "I\'ve completed" or "Is there anything else?"—these natural language signals indicate the task is finished.',
          },
          {
            letter: 'B',
            text: 'Set a maximum iteration count (e.g., 10 calls) and stop when reached, regardless of whether Claude indicates more work is needed.',
          },
          {
            letter: 'C',
            text: 'Check the stop_reason field in Claude\'s response—continue when it equals "tool_use" and stop when it equals "end_turn".',
          },
          {
            letter: 'D',
            text: 'Check whether the response includes any assistant text content—if Claude generated explanatory text, the loop should end.',
          },
        ],
        correct: 'C',
        explanation:
          'This is correct. The `stop_reason` field is Claude\'s explicit, structured signal for loop control: `"tool_use"` indicates Claude wants to execute a tool and receive the results back, while `"end_turn"` indicates Claude has completed its response and the loop should terminate.',
      },
      {
        id: 8,
        text: 'Production logs show the agent sometimes selects get_customer when lookup_order would be more appropriate, particularly for ambiguous requests like "I need help with my recent purchase." You decide to add few-shot examples to your system prompt to improve tool selection. Which approach will most effectively address this issue?',
        options: [
          {
            letter: 'A',
            text: 'Add 10-15 examples of clear, unambiguous requests that demonstrate correct tool selection for each tool\'s typical use cases.',
          },
          {
            letter: 'B',
            text: 'Add examples grouped by tool—all get_customer scenarios together, then all lookup_order scenarios.',
          },
          {
            letter: 'C',
            text: 'Add explicit "use when" and "do not use when" guidelines in each tool\'s description covering the ambiguous cases.',
          },
          {
            letter: 'D',
            text: 'Add 4-6 examples targeting ambiguous scenarios, each showing reasoning for why one tool was chosen over plausible alternatives.',
          },
        ],
        correct: 'D',
        explanation:
          'Targeting few-shot examples at the specific ambiguous scenarios where errors occur, with explicit reasoning about why one tool is preferred over another, directly teaches the model the comparative decision-making process it needs for edge cases. This approach is the most effective because worked examples demonstrating reasoning are better than declarative rules for nuanced tool selection.',
        wrongExplanations: {
          C: 'Adding explicit usage guidelines to tool descriptions can help, but static declarative rules are less effective than worked examples for teaching nuanced edge-case reasoning. The model benefits more from seeing the actual decision process in context than from reading abstract rules about when to use or avoid each tool.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Tool Selection Reliability concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.1',
      },
      {
        id: 9,
        text: 'Production logs reveal that the agent misinterprets data from your MCP tools: Unix timestamps from get_customer, ISO 8601 dates from lookup_order, and numeric status codes (1=pending, 2=shipped). Some tools are third-party MCP servers you cannot modify. What\'s the most maintainable approach to normalize data formats?',
        options: [
          {
            letter: 'A',
            text: 'Use a PostToolUse hook to intercept tool results and apply formatting transformations before agent processing',
          },
          {
            letter: 'B',
            text: 'Create a normalize_data tool that the agent calls after each data retrieval to transform values',
          },
          {
            letter: 'C',
            text: 'Modify tools you control to return human-readable formats; create wrapper tools for third-party tools',
          },
          {
            letter: 'D',
            text: 'Add detailed format documentation to your system prompt explaining each tool\'s data conventions',
          },
        ],
        correct: 'A',
        explanation:
          'Using a PostToolUse hook provides a centralized, deterministic point to intercept and normalize all tool outputs—including those from third-party MCP servers—before the agent processes them. This is the most maintainable approach because it applies transformations uniformly via code rather than relying on LLM interpretation or agent behavior.',
        wrongExplanations: {
          C: 'Modifying tools you control while wrapping third-party tools creates two different normalization strategies, resulting in an inconsistent and harder-to-maintain architecture. This dual approach increases complexity and makes it difficult to ensure uniform data formatting across all tools.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Agent SDK Hook Patterns concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.5',
      },
      {
        id: 10,
        text: 'Your support agent uses progressive summarization—when context reaches 70% capacity, older turns are summarized while recent ones remain verbatim. Production logs reveal a pattern: customers reference specific amounts ("the 15% discount I mentioned"), but the agent responds with incorrect values. Investigation shows these details were stated 20+ turns ago and got condensed into vague summaries like "discussed promotional pricing." What\'s the most effective fix?',
        options: [
          {
            letter: 'A',
            text: 'Store full conversation history externally and implement retrieval to search it when the agent detects reference phrases like "as I mentioned."',
          },
          {
            letter: 'B',
            text: 'Increase the summarization threshold from 70% to 85% capacity so conversations have more room before summarization triggers.',
          },
          {
            letter: 'C',
            text: 'Revise the summarization prompt to explicitly preserve all numerical values, percentages, dates, and customer-stated expectations verbatim.',
          },
          {
            letter: 'D',
            text: 'Extract transactional facts (amounts, dates, order numbers) into a persistent "case facts" block included in each prompt, outside the summarized history.',
          },
        ],
        correct: 'D',
        explanation:
          'Extracting transactional facts (amounts, dates, order numbers) into a persistent "case facts" block addresses the root cause: summarization is inherently lossy for precise details. By preserving critical information in a structured block outside the summarized history, these facts remain reliably available in every prompt regardless of how many turns are summarized.',
      },
      {
        id: 11,
        text: 'Your get_customer tool returns all matches when searching by name. Claude currently picks the customer with the most recent order when multiple results are returned, but production data shows this causes 15% of multi-match cases to proceed with the wrong customer account. How should you address this?',
        options: [
          {
            letter: 'A',
            text: 'Add few-shot examples showing Claude how to use conversational context (products mentioned, dates referenced) to infer the correct customer without requiring clarification.',
          },
          {
            letter: 'B',
            text: 'Modify get_customer to return only the single most likely match based on a ranking algorithm, simplifying Claude\'s decision by eliminating ambiguous results.',
          },
          {
            letter: 'C',
            text: 'Implement a confidence scoring system that proceeds automatically above 85% confidence and prompts for clarification below that threshold.',
          },
          {
            letter: 'D',
            text: 'Instruct Claude to ask for an additional identifier (email, phone, or order number) when get_customer returns multiple matches, before taking any customer-specific action.',
          },
        ],
        correct: 'D',
        explanation:
          'Asking the user for an additional identifier (such as email, phone, or order number) is the most reliable way to disambiguate multiple matches, since the user has definitive knowledge of their own identity. One extra conversational turn is a small cost to eliminate the 15% error rate caused by incorrect customer selection.',
      },
      {
        id: 12,
        text: 'Production logs show the agent frequently calls get_customer when users ask about orders (e.g., "check my order #12345"), instead of calling lookup_order. Both tools have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifier formats. What\'s the most effective first step to improve tool selection reliability?',
        options: [
          {
            letter: 'A',
            text: 'Expand each tool\'s description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.',
          },
          {
            letter: 'B',
            text: 'Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to lookup_order.',
          },
          {
            letter: 'C',
            text: 'Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query.',
          },
          {
            letter: 'D',
            text: 'Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.',
          },
        ],
        correct: 'A',
        explanation:
          'Expanding tool descriptions to include input formats, example queries, edge cases, and boundaries directly addresses the root cause—minimal descriptions that leave the LLM unable to distinguish between similar tools. This is a low-effort, high-leverage first step that improves the primary mechanism LLMs use for tool selection.',
      },
      {
        id: 13,
        text: 'Production metrics show that when your agent resolves complex cases involving billing disputes or multi-order returns, customer satisfaction scores are 15% lower than for simple cases—even when the resolution is technically correct. Root cause analysis reveals the agent provides accurate resolutions but inconsistently explains the reasoning: sometimes omitting relevant policy details, other times missing timeline information or next steps. The specific context gaps vary by case. You want to improve resolution quality without adding human review overhead. Which approach is most effective?',
        options: [
          {
            letter: 'A',
            text: 'Increase the model tier from Haiku to Sonnet for complex cases, routing based on detected case complexity.',
          },
          {
            letter: 'B',
            text: 'Add a confirmation step where the agent asks "Does this fully address your concern?" before closing, letting customers request additional information if needed.',
          },
          {
            letter: 'C',
            text: 'Add a self-critique step where the agent evaluates its draft response for completeness—ensuring it addresses the customer\'s concern, includes relevant context, and anticipates follow-up questions.',
          },
          {
            letter: 'D',
            text: 'Implement few-shot examples in the system prompt showing complete resolution explanations for five common complex case types, demonstrating how to include policy context, timelines, and next steps.',
          },
        ],
        correct: 'C',
        explanation:
          'A self-critique step (evaluator-optimizer pattern) directly addresses the root cause of inconsistent explanation completeness by having the agent evaluate its own draft against specific criteria—such as policy context, timelines, and next steps—before presenting it. This catches case-specific gaps that vary across different complex scenarios without requiring human review.',
        wrongExplanations: {
          D: 'While few-shot examples can demonstrate ideal response structure for common case types, they cannot adequately cover the highly variable context gaps that differ from case to case. This approach works better for consistent, predictable patterns rather than the diverse omissions described in the scenario.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Self-Evaluation Patterns concepts in the exam study guide.',
        studyAreaLink: '/domains/d4#task-4.6',
      },
      {
        id: 14,
        text: 'Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What\'s the most effective way to improve escalation calibration?',
        options: [
          {
            letter: 'A',
            text: 'Have the agent self-report a confidence score (1-10) before each response and automatically route requests to humans when confidence falls below a threshold.',
          },
          {
            letter: 'B',
            text: 'Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.',
          },
          {
            letter: 'C',
            text: 'Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.',
          },
          {
            letter: 'D',
            text: 'Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold.',
          },
        ],
        correct: 'C',
        explanation:
          'Adding explicit escalation criteria with few-shot examples directly addresses the root cause—unclear decision boundaries between straightforward and complex cases. This is the most proportionate and effective first intervention, as it teaches the agent precisely when to escalate versus resolve autonomously without requiring additional infrastructure.',
      },
      {
        id: 15,
        text: 'After calling get_customer and lookup_order, the agent has retrieved all available system data but faces uncertainty. Which situation represents the most appropriate trigger for calling escalate_to_human?',
        options: [
          {
            letter: 'A',
            text: 'The customer claims they never received their order, but tracking shows it was delivered and signed for at their address three days ago. The agent should escalate because presenting contradictory evidence might damage the customer relationship.',
          },
          {
            letter: 'B',
            text: 'The customer\'s message mentions both a billing question and a product return. The agent should escalate so a human can coordinate handling both issues in a single interaction.',
          },
          {
            letter: 'C',
            text: 'The customer requests a price match against a competitor. Your policies allow adjustments for price drops on your own site within 14 days but are silent on competitor pricing. The agent should escalate for policy interpretation.',
          },
          {
            letter: 'D',
            text: 'The customer wants to cancel an order that shipped yesterday, with delivery scheduled for tomorrow. The agent should escalate because the customer might change their mind once they receive the package.',
          },
        ],
        correct: 'C',
        explanation:
          'This represents a genuine policy gap where the company\'s guidelines cover own-site price drops but are silent on competitor price matching, meaning the agent cannot fabricate a policy and must escalate for human judgment on how to interpret or extend existing rules.',
        wrongExplanations: {
          A: 'While the situation involves contradictory information, the agent has factual tracking data to share with the customer per standard procedure; escalating to avoid presenting evidence out of concern for relationship damage reflects emotional avoidance rather than an operational need for human intervention.',
        },
        studyArea:
          'Customer Support Resolution Agent — review Escalation Decisions concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.4',
      },
    ],
  },
  {
    id: 's3',
    title: 'Code Generation with Claude Code',
    shortTitle: 'Code Generation',
    context:
      'You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.',
    color: '#2d308d',
    questions: [
      {
        id: 1,
        text: 'You\'ve been assigned to restructure the team\'s monolithic application into microservices. This will involve changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?',
        options: [
          {
            letter: 'A',
            text: 'Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.',
          },
          {
            letter: 'B',
            text: 'Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.',
          },
          {
            letter: 'C',
            text: 'Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation.',
          },
          {
            letter: 'D',
            text: 'Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.',
          },
        ],
        correct: 'D',
        explanation:
          'Using plan mode to explore the codebase, understand dependencies, and design an approach before making changes is the correct strategy for a complex architectural restructuring like breaking apart a monolith. This allows safe exploration and informed decision-making about service boundaries before committing to potentially costly changes across dozens of files.',
      },
      {
        id: 2,
        text: 'Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., Button.test.tsx next to Button.tsx), and you want all tests to follow the same conventions regardless of location. What\'s the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?',
        options: [
          {
            letter: 'A',
            text: 'Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies',
          },
          {
            letter: 'B',
            text: 'Place a separate CLAUDE.md file in each subdirectory containing that area\'s specific conventions',
          },
          {
            letter: 'C',
            text: 'Create skills in .claude/skills/ for each code type that include the relevant conventions in their SKILL.md files',
          },
          {
            letter: 'D',
            text: 'Create rule files in .claude/rules/ with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths',
          },
        ],
        correct: 'D',
        explanation:
          'Using rule files in `.claude/rules/` with YAML frontmatter and glob patterns (e.g., `**/*.test.tsx`, `src/api/**/*.ts`) allows conventions to be automatically and deterministically applied based on file paths, regardless of where those files are located in the directory structure. This is the most maintainable approach because it handles cross-cutting concerns like test files spread throughout the codebase without requiring duplication or manual intervention.',
      },
      {
        id: 3,
        text: 'Your team created an /analyze-codebase skill that performs comprehensive code analysis—dependency scanning, test coverage calculation, and code quality metrics. After running this command, team members report that Claude becomes less responsive in the session and loses track of their original task. What\'s the most effective way to address this while preserving full analysis capability?',
        options: [
          {
            letter: 'A',
            text: 'Add instructions to the skill to compress all outputs into a brief summary before displaying',
          },
          {
            letter: 'B',
            text: 'Split the skill into three smaller skills that each generate less output',
          },
          {
            letter: 'C',
            text: 'Add context: fork to the skill\'s frontmatter to run the analysis in an isolated sub-agent context',
          },
          {
            letter: 'D',
            text: 'Add model: haiku to the frontmatter to use a faster, more efficient model for the analysis',
          },
        ],
        correct: 'C',
        explanation:
          'Using `context: fork` in the skill\'s frontmatter runs the analysis in an isolated sub-agent context, which prevents the verbose output from polluting the main conversation\'s context window and causing Claude to lose track of the original task. This preserves full analysis capability while keeping the main session responsive.',
      },
      {
        id: 4,
        text: 'Your team wants to add a GitHub MCP server to enable PR lookups and CI status checks through Claude Code. Each of the six developers has their own GitHub personal access token. You want consistent tooling across the team without committing credentials to version control. What\'s the most effective configuration approach?',
        options: [
          {
            letter: 'A',
            text: 'Create an MCP server wrapper that reads tokens from a .env file and proxies requests to the GitHub API, then add this wrapper to your project .mcp.json.',
          },
          {
            letter: 'B',
            text: 'Configure the server in project scope with a placeholder token value, then instruct developers to override it in their local scope configuration.',
          },
          {
            letter: 'C',
            text: 'Have each developer configure the server in user scope with claude mcp add --scope user.',
          },
          {
            letter: 'D',
            text: 'Add the server to a project-scoped .mcp.json with environment variable expansion (${GITHUB_TOKEN}) for authentication, and document the required environment variable in your project README.',
          },
        ],
        correct: 'D',
        explanation:
          'Using a project-scoped `.mcp.json` with environment variable expansion (`${GITHUB_TOKEN}`) is the idiomatic approach—it provides a single, version-controlled source of truth for the team\'s MCP configuration while allowing each developer to supply their own credentials through environment variables. Documenting the required variable in the README ensures easy onboarding without ever committing secrets.',
        wrongExplanations: {
          B: 'Committing a placeholder token value to the project-scoped configuration is an anti-pattern that could be mistaken for a real credential and relies on a fragile override mechanism that developers may forget or misconfigure. This approach adds unnecessary complexity compared to native environment variable expansion.',
        },
        studyArea:
          'Code Generation with Claude Code — review MCP Server Integration concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.4',
      },
      {
        id: 5,
        text: 'You\'ve asked Claude Code to implement a function that transforms API responses into a normalized internal format. After two iterations, the output structure still doesn\'t match expectations—some fields are nested differently and timestamps aren\'t formatted correctly. You\'ve been describing the requirements in prose, but Claude seems to interpret them differently each time. What\'s the most effective approach for the next iteration?',
        options: [
          {
            letter: 'A',
            text: 'Rewrite your requirements with greater technical precision, specifying exact field mappings, nesting rules, and timestamp format strings.',
          },
          {
            letter: 'B',
            text: 'Provide 2-3 concrete input-output examples showing the expected transformation for representative API responses.',
          },
          {
            letter: 'C',
            text: 'Ask Claude to explain its current interpretation of the requirements so you can identify where understanding diverges.',
          },
          {
            letter: 'D',
            text: 'Write a JSON schema defining the expected output structure and validate Claude\'s output against it after each iteration.',
          },
        ],
        correct: 'B',
        explanation:
          'Providing concrete input-output examples is the most effective approach because it eliminates the ambiguity inherent in prose descriptions by showing Claude exactly what the expected transformation looks like. This directly addresses the root cause—misinterpretation of prose requirements—by giving unambiguous, concrete targets for field nesting and timestamp formatting.',
        wrongExplanations: {
          D: 'A JSON schema can validate the output structure but doesn\'t help Claude understand the actual transformation logic needed to produce correct results. This approach addresses verification rather than comprehension, meaning Claude would still need to understand the mapping requirements to generate correct output in the first place.',
        },
        studyArea:
          'Code Generation with Claude Code — review Iterative Refinement concepts in the exam study guide.',
        studyAreaLink: '/domains/d3#task-3.5',
      },
      {
        id: 6,
        text: 'Your team has been using Claude Code for several months. Recently, three developers report that Claude correctly follows your "always include comprehensive error handling" guideline, but a fourth developer who just joined reports Claude isn\'t following this guideline. All four developers are working in the same repository and have the latest code pulled. What\'s the most likely cause and appropriate fix?',
        options: [
          {
            letter: 'A',
            text: 'Claude Code caches CLAUDE.md contents after first read. The original developers have cached versions while the new developer loaded after the file was modified. Have all developers clear their Claude Code cache.',
          },
          {
            letter: 'B',
            text: 'The guideline exists in the original developers\' ~/.claude/CLAUDE.md files (user-level) instead of the project\'s .claude/CLAUDE.md. Move the instruction to the project-level file so all team members receive it.',
          },
          {
            letter: 'C',
            text: 'The new developer\'s ~/.claude/CLAUDE.md contains conflicting instructions that override the project settings. Have them remove the conflicting section from their user-level configuration.',
          },
          {
            letter: 'D',
            text: 'Claude Code builds per-user preference models over time through repeated interactions. The new developer needs to repeatedly specify the error handling requirement until Claude learns their preferences.',
          },
        ],
        correct: 'B',
        explanation:
          'This is the most likely cause: if the error handling guideline was added to each original developer\'s user-level ~/.claude/CLAUDE.md rather than the project\'s .claude/CLAUDE.md, new team members would not receive it. Moving the instruction to the project-level configuration file ensures all current and future team members automatically receive the guideline.',
      },
      {
        id: 7,
        text: 'Your CLAUDE.md has grown to over 400 lines containing coding standards, testing conventions, a detailed PR review checklist, deployment workflow instructions, and database migration procedures. You want Claude to always follow the coding standards and testing conventions, but only apply PR review, deployment, and migration guidance when you\'re actually performing those tasks. What\'s the most effective restructuring approach?',
        options: [
          {
            letter: 'A',
            text: 'Keep all content in CLAUDE.md but use @import syntax to organize it into separately maintained files by category',
          },
          {
            letter: 'B',
            text: 'Move all guidance into separate Skills files organized by workflow type, keeping only a brief project description in CLAUDE.md',
          },
          {
            letter: 'C',
            text: 'Keep universal standards in CLAUDE.md and create Skills for task-specific workflows (PR reviews, deployments, migrations) with trigger keywords',
          },
          {
            letter: 'D',
            text: 'Split the CLAUDE.md into files in .claude/rules/ with path-specific glob patterns so each rule loads only for matching file types',
          },
        ],
        correct: 'C',
        explanation:
          'This is the most effective approach because CLAUDE.md content is loaded for every conversation, ensuring coding standards and testing conventions are always applied, while Skills are invoked on-demand when Claude detects relevant trigger keywords, making them ideal for task-specific workflows like PR reviews, deployments, and migrations.',
      },
      {
        id: 8,
        text: 'You\'ve created a /commit skill in .claude/skills/commit/SKILL.md that your team uses. One developer wants to customize it for their personal workflow (different commit message format, additional checks) without affecting teammates. What should you recommend?',
        options: [
          {
            letter: 'A',
            text: 'Create a personal version at ~/.claude/skills/commit/SKILL.md with the same name',
          },
          {
            letter: 'B',
            text: 'Add username-based conditional logic to the project skill\'s frontmatter',
          },
          {
            letter: 'C',
            text: 'Create a personal version in ~/.claude/skills/ with a different name like /my-commit',
          },
          {
            letter: 'D',
            text: 'Set override: true in the personal skill\'s frontmatter to take precedence over the project version',
          },
        ],
        correct: 'C',
        explanation:
          'This is correct. Since project skills take precedence over personal skills with the same name, the developer must use a different skill name (like `/my-commit`) in their personal `~/.claude/skills/` directory to ensure their custom version is accessible alongside the team\'s project skill.',
      },
      {
        id: 9,
        text: 'You\'re creating a custom /explore-alternatives skill that your team uses to brainstorm and evaluate different implementation approaches before committing to one. However, developers report that after running this skill, Claude\'s subsequent responses are influenced by the exploration discussion—sometimes referencing abandoned approaches or maintaining exploratory context that confuses actual implementation work. What\'s the most effective way to configure this skill?',
        options: [
          {
            letter: 'A',
            text: 'Split the skill into two separate skills—/explore-start and /explore-end—to demarcate when exploration context should be discarded.',
          },
          {
            letter: 'B',
            text: 'Use the ! prefix in the skill to execute the exploration logic as a bash subprocess.',
          },
          {
            letter: 'C',
            text: 'Create the skill in ~/.claude/skills/ instead of .claude/skills/.',
          },
          {
            letter: 'D',
            text: 'Add context: fork to the skill\'s frontmatter.',
          },
        ],
        correct: 'D',
        explanation:
          'The `context: fork` frontmatter option runs the skill in an isolated sub-agent context, so the exploration discussion does not pollute the main conversation history. This prevents abandoned approaches and exploratory context from influencing subsequent implementation work.',
      },
      {
        id: 10,
        text: 'You need to add Slack as a new notification channel. The existing codebase has clear, consistent patterns for email, SMS, and push channels. However, the Slack API offers fundamentally different integration approaches—incoming webhooks (simple, one-way only), bot tokens (enables delivery confirmation and programmatic control), or Slack Apps (bidirectional events, requires workspace approval). Your ticket says "add Slack support" without specifying which integration method or whether advanced features like delivery tracking will be needed. How should you approach this task?',
        options: [
          {
            letter: 'A',
            text: 'Start direct execution to scaffold the Slack channel class following existing patterns, deferring the integration method decision until later.',
          },
          {
            letter: 'B',
            text: 'Start direct execution using incoming webhooks to match the existing one-way notification pattern.',
          },
          {
            letter: 'C',
            text: 'Start direct execution using the bot token approach to enable delivery confirmation capabilities.',
          },
          {
            letter: 'D',
            text: 'Enter plan mode to explore the integration options and their architectural implications, then present a recommendation before implementing.',
          },
        ],
        correct: 'D',
        explanation:
          'This is correct because the Slack integration involves multiple valid approaches with significantly different architectural implications, and the requirements are ambiguous. Using plan mode to explore trade-offs between webhooks, bot tokens, and Slack Apps allows for an informed recommendation and team alignment before committing to an implementation path.',
      },
      {
        id: 11,
        text: 'You\'ve found that including 2-3 full exemplar endpoint implementations as context significantly improves consistency when generating new API endpoints. However, this context is only useful for creating new endpoints—not for bug fixes, code reviews, or other API directory work. What\'s the most efficient configuration approach?',
        options: [
          {
            letter: 'A',
            text: 'Create a skill that references the exemplar endpoints and includes pattern-following instructions, invoked on-demand via slash command.',
          },
          {
            letter: 'B',
            text: 'Configure path-specific rules in .claude/rules/api/ that include the exemplar code and activate when working in the API directory.',
          },
          {
            letter: 'C',
            text: 'Reference the exemplar endpoints manually in each generation request by copying relevant code into your prompt.',
          },
          {
            letter: 'D',
            text: 'Add the exemplar endpoint code with pattern documentation to the project CLAUDE.md file so it\'s automatically available.',
          },
        ],
        correct: 'A',
        explanation:
          'Creating a skill with the exemplar endpoints and pattern-following instructions allows on-demand invocation via a slash command, ensuring the context is loaded only when generating new endpoints and not during unrelated tasks like bug fixes or code reviews.',
        wrongExplanations: {
          B: 'Path-specific rules that activate when working in the API directory would trigger for all API directory work, including bug fixes and code reviews—exactly the scenarios where the exemplar context is unnecessary and wasteful.',
        },
        studyArea:
          'Code Generation with Claude Code — review Custom Slash Commands concepts in the exam study guide.',
        studyAreaLink: '/domains/d3#task-3.2',
      },
      {
        id: 12,
        text: 'You want to create a custom /review slash command that runs your team\'s standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?',
        options: [
          {
            letter: 'A',
            text: 'In the CLAUDE.md file at the project root',
          },
          {
            letter: 'B',
            text: 'In ~/.claude/commands/ in each developer\'s home directory',
          },
          {
            letter: 'C',
            text: 'In a .claude/config.json file with a commands array',
          },
          {
            letter: 'D',
            text: 'In the .claude/commands/ directory in the project repository',
          },
        ],
        correct: 'D',
        explanation:
          'Placing custom slash commands in the `.claude/commands/` directory within the project repository is correct because these files are version-controlled and automatically available to every developer who clones or pulls the repo. This is the designated location for project-scoped custom commands in Claude Code.',
      },
      {
        id: 13,
        text: 'Your team\'s CLAUDE.md file has grown to over 500 lines, mixing TypeScript conventions, testing guidelines, API patterns, and deployment procedures. Developers find it difficult to locate and update relevant sections. What approach does Claude Code support for organizing project-level instructions into focused, topic-specific modules?',
        options: [
          {
            letter: 'A',
            text: 'Create separate markdown files in .claude/rules/, each covering one topic (e.g., testing.md, api-conventions.md)',
          },
          {
            letter: 'B',
            text: 'Create multiple files named CLAUDE.md at different levels of the directory tree, each one overriding the parent\'s instructions',
          },
          {
            letter: 'C',
            text: 'Define a .claude/config.yaml file that maps file patterns to specific sections within CLAUDE.md',
          },
          {
            letter: 'D',
            text: 'Split instructions into README.md files in relevant subdirectories, which Claude automatically loads as instructions',
          },
        ],
        correct: 'A',
        explanation:
          'This is correct. Claude Code supports a `.claude/rules/` directory where you can create separate markdown files for topic-specific guidelines (e.g., `testing.md`, `api-conventions.md`), allowing teams to organize large instruction sets into focused, maintainable modules.',
      },
      {
        id: 14,
        text: 'Your team has created a /migration skill that generates database migration files. The skill accepts a migration name via $ARGUMENTS. In production, you\'re seeing three issues: (1) developers often invoke the skill without arguments, resulting in poorly-named files, (2) the skill sometimes incorporates database schema details from unrelated earlier conversations, and (3) a developer accidentally triggered destructive test cleanup when the skill had broad tool access. Which configuration approach addresses all three issues?',
        options: [
          {
            letter: 'A',
            text: 'Add argument-hint frontmatter to prompt for required parameters, use context: fork to isolate execution, and restrict allowed-tools to file write operations.',
          },
          {
            letter: 'B',
            text: 'Use positional parameters $1 and $2 instead of $ARGUMENTS to enforce specific inputs, include explicit schema file references via @ syntax to control context, and add description frontmatter warning about destructive operations.',
          },
          {
            letter: 'C',
            text: 'Include validation instructions in the skill\'s SKILL.md that direct Claude to verify $ARGUMENTS contains a valid name, add prompts to ignore prior conversation context, and list forbidden operations Claude should avoid.',
          },
          {
            letter: 'D',
            text: 'Split into separate /migration-create and /migration-apply skills, add instructions in each SKILL.md to request a migration name if not provided, and use different allowed-tools scopes for each skill.',
          },
        ],
        correct: 'A',
        explanation:
          'This approach correctly uses three distinct skill configuration features to address each issue: `argument-hint` frontmatter shows expected parameters during autocomplete (addressing missing arguments), `context: fork` isolates execution in a subagent context separate from conversation history (preventing context bleeding from earlier conversations), and `allowed-tools` restricts tool access to only file write operations (preventing destructive actions).',
      },
      {
        id: 15,
        text: 'You\'re adding error handling wrappers to external API calls across a 120-file codebase. The task has three phases: (1) discovering all API call locations and patterns, (2) designing the error handling approach collaboratively, and (3) implementing wrappers consistently. During Phase 1, Claude generates verbose output listing hundreds of call sites with context. Your context window is filling rapidly before you\'ve finished discovery.\n\nWhat\'s the most effective approach to complete this while maintaining implementation consistency?',
        options: [
          {
            letter: 'A',
            text: 'Switch to headless mode with --continue, passing explicit context summaries between batch invocations to maintain continuity.',
          },
          {
            letter: 'B',
            text: 'Define your error handling pattern in CLAUDE.md, then process files in batches across multiple sessions, relying on the shared memory file for consistency.',
          },
          {
            letter: 'C',
            text: 'Use the Explore subagent for Phase 1 to isolate verbose output and return a summary, then continue Phases 2-3 in the main conversation.',
          },
          {
            letter: 'D',
            text: 'Continue all phases in the main conversation, using /compact periodically to reduce context usage as you progress through the files.',
          },
        ],
        correct: 'C',
        explanation:
          'Using the Explore subagent for Phase 1 is ideal because it isolates the verbose discovery output in a separate context, returning only a concise summary to the main conversation. This preserves the main context window for the collaborative design and consistent implementation phases where retained context is most valuable.',
      },
    ],
  },
  {
    id: 's4',
    title: 'Multi-Agent Research System',
    shortTitle: 'Multi-Agent System',
    context:
      'You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.',
    color: '#7b1fa2',
    questions: [
      {
        id: 1,
        text: 'The document analysis subagent frequently encounters failures when processing PDF files—some have corrupted sections causing parsing exceptions, others are password-protected, and occasionally the parsing library times out on large files. Currently, any exception immediately terminates the subagent and returns an error to the coordinator, which must decide whether to retry, skip the document, or fail the entire research task. This is causing excessive coordinator involvement in routine error handling. What\'s the most effective architectural improvement?',
        options: [
          {
            letter: 'A',
            text: 'Create a dedicated error-handling agent that monitors all subagent failures via a shared queue and makes recovery decisions independently, dispatching retry commands directly to subagents.',
          },
          {
            letter: 'B',
            text: 'Have the coordinator validate all documents before dispatching to the subagent, rejecting documents likely to cause failures to ensure the subagent only receives processable files.',
          },
          {
            letter: 'C',
            text: 'Configure the subagent to always return partial results with success status, embedding error details in metadata. The coordinator treats all responses as successful and filters problematic items during synthesis.',
          },
          {
            letter: 'D',
            text: 'Have the subagent implement local recovery for transient failures and only propagate errors it cannot resolve to the coordinator, including what was attempted and any partial results obtained.',
          },
        ],
        correct: 'D',
        explanation:
          'Implementing local recovery for transient failures within the subagent follows the principle of handling errors at the lowest level capable of resolving them. This reduces excessive coordinator involvement while still escalating truly unresolvable issues with full context, including what recovery was attempted and any partial results obtained.',
      },
      {
        id: 2,
        text: 'During testing, combined outputs from the web search agent (85K tokens including page content) and the document analysis agent (70K tokens including reasoning chains) total 155K tokens, but the synthesis agent performs optimally with inputs under 50K tokens. What\'s the most effective solution?',
        options: [
          {
            letter: 'A',
            text: 'Store findings in a vector database and give the synthesis agent retrieval tools to query during its work',
          },
          {
            letter: 'B',
            text: 'Modify upstream agents to return structured data (key facts, citations, relevance scores) instead of verbose content and reasoning',
          },
          {
            letter: 'C',
            text: 'Have the synthesis agent process findings in sequential batches, maintaining running state between calls',
          },
          {
            letter: 'D',
            text: 'Add an intermediate summarization agent that condenses findings before passing to synthesis',
          },
        ],
        correct: 'B',
        explanation:
          'Modifying upstream agents to return structured data (key facts, citations, relevance scores) addresses the root cause by reducing token volume at the source while preserving essential information. This eliminates verbose page content and reasoning chains that inflate token counts without adding value for the synthesis step.',
        wrongExplanations: {
          A: 'Using a vector database with retrieval tools is over-engineered for this scenario, as synthesis requires comprehensive coverage of all known findings rather than selective query-based retrieval. This approach risks missing important information that doesn\'t match the synthesis agent\'s queries and adds unnecessary architectural complexity.',
        },
        studyArea:
          'Multi-Agent Research System — review Multi-Agent Orchestration concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.2',
      },
      {
        id: 3,
        text: 'During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks (dates, names, statistics) while 15% require deeper investigation. What\'s the most effective approach to reduce overhead while maintaining system reliability?',
        options: [
          {
            letter: 'A',
            text: 'Give the synthesis agent a scoped verify_fact tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.',
          },
          {
            letter: 'B',
            text: 'Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify.',
          },
          {
            letter: 'C',
            text: 'Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once.',
          },
          {
            letter: 'D',
            text: 'Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.',
          },
        ],
        correct: 'A',
        explanation:
          'Providing a scoped fact-verification tool handles the 85% of simple lookups directly, eliminating most round-trips while preserving the coordinator-based delegation path for the 15% of complex verifications. This applies the principle of least privilege, keeping the synthesis agent focused on its primary task while still reducing latency significantly.',
        wrongExplanations: {
          B: 'Proactive caching relies on speculative prediction of what the synthesis agent will need to verify, which is inherently unreliable and wastes resources fetching information that may never be needed. This approach cannot anticipate the specific facts requiring verification with sufficient accuracy to meaningfully reduce round-trips.',
        },
        studyArea:
          'Multi-Agent Research System — review Tool Distribution concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.3',
      },
      {
        id: 4,
        text: 'During a materials research task, the web search subagent queries three source categories with different outcomes: academic databases returned 15 relevant papers, industry reports returned "0 results found," and patent databases returned "Connection timeout." When designing error propagation to the coordinator, what approach enables the best recovery decisions?',
        options: [
          {
            letter: 'A',
            text: 'Have the subagent retry transient failures internally and only report persistent errors.',
          },
          {
            letter: 'B',
            text: 'Distinguish access failures (timeout) needing retry decisions from valid empty results ("0 results") representing successful queries.',
          },
          {
            letter: 'C',
            text: 'Aggregate outcomes into a single success rate metric (e.g., "67% source coverage") with detailed logs available on request.',
          },
          {
            letter: 'D',
            text: 'Report both the timeout and "0 results" as failures requiring coordinator intervention.',
          },
        ],
        correct: 'B',
        explanation:
          'This is correct because a timeout (access failure) and \'0 results\' (valid empty result) are semantically distinct outcomes requiring different responses. Distinguishing them enables the coordinator to retry the timed-out patent database while accepting the empty industry report results as a valid and informative finding.',
        wrongExplanations: {
          A: 'Having the subagent retry transient failures internally without reporting them hides important context from the coordinator, which limits its ability to manage resource budgets and make informed decisions about retry strategies. The coordinator needs visibility into access failures to appropriately allocate time and resources across the workflow.',
        },
        studyArea:
          'Multi-Agent Research System — review Error Propagation concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.2',
      },
      {
        id: 5,
        text: 'The document analysis subagent encounters a corrupted PDF file it cannot parse. When designing the system\'s error handling, what is the most effective way to handle this failure?',
        options: [
          {
            letter: 'A',
            text: 'Silently skip the corrupted document and continue processing other files to avoid interrupting the workflow.',
          },
          {
            letter: 'B',
            text: 'Throw an exception that terminates the entire research workflow.',
          },
          {
            letter: 'C',
            text: 'Automatically retry parsing the document three times with exponential backoff before reporting failure.',
          },
          {
            letter: 'D',
            text: 'Return the error with context to the coordinator agent, letting it decide how to proceed.',
          },
        ],
        correct: 'D',
        explanation:
          'Returning the error with context to the coordinator agent is the most effective approach because it enables the coordinator to make an informed decision—such as skipping the file, trying an alternative parsing method, or notifying the user—while maintaining visibility into the failure.',
        wrongExplanations: {
          C: 'Retrying with exponential backoff is a strategy suited for transient failures such as network timeouts, but file corruption is a permanent condition that will not resolve on its own, making repeated attempts wasteful and ineffective.',
        },
        studyArea:
          'Multi-Agent Research System — review Error Propagation concepts in the exam study guide.',
        studyAreaLink: '/domains/d2#task-2.2',
      },
      {
        id: 6,
        text: 'When designing the system, you gave the document analysis agent access to a general-purpose fetch_url tool so it could load documents from URLs. Production logs reveal this agent now frequently fetches search engine result pages to conduct ad-hoc web searches—behavior that should route through the web search agent. This causes inconsistent results. What\'s the most effective fix?',
        options: [
          {
            letter: 'A',
            text: 'Replace fetch_url with a load_document tool that validates URLs point to document formats.',
          },
          {
            letter: 'B',
            text: 'Add instructions to the document analysis agent\'s prompt clarifying it should only use fetch_url for loading document URLs, not searching.',
          },
          {
            letter: 'C',
            text: 'Implement filtering that blocks fetch_url calls to known search engine domains while allowing other URLs.',
          },
          {
            letter: 'D',
            text: 'Remove fetch_url from the document analysis agent and route all URL loading through the coordinator to the web search agent.',
          },
        ],
        correct: 'A',
        explanation:
          'Replacing the general-purpose tool with a document-specific tool that validates URLs point to document formats addresses the root cause by constraining capability at the interface level. This follows the principle of least privilege, making the undesired search behavior impossible rather than merely discouraged.',
      },
      {
        id: 7,
        text: 'The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?',
        options: [
          {
            letter: 'A',
            text: 'Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow.',
          },
          {
            letter: 'B',
            text: 'Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.',
          },
          {
            letter: 'C',
            text: 'Implement automatic retry logic with exponential backoff within the subagent, returning a generic "search unavailable" status only after all retries are exhausted.',
          },
          {
            letter: 'D',
            text: 'Catch the timeout within the subagent and return an empty result set marked as successful.',
          },
        ],
        correct: 'B',
        explanation:
          'Returning structured error context—including the failure type, attempted query, partial results, and alternative approaches—gives the coordinator all the information it needs to make intelligent recovery decisions, such as retrying with a modified query or proceeding with partial results. This is the best approach because it preserves maximum context for informed decision-making at the coordination level.',
      },
      {
        id: 8,
        text: 'When researching a broad topic, you observe that the web search agent and document analysis agent are both investigating the same subtopics, resulting in significant overlap in their findings. Token usage has nearly doubled without proportionally increasing the breadth or depth of research coverage. What\'s the most effective way to address this?',
        options: [
          {
            letter: 'A',
            text: 'Convert to sequential execution where document analysis runs only after web search completes, using the web search findings as context to avoid duplication',
          },
          {
            letter: 'B',
            text: 'Have the coordinator explicitly partition the research space before delegation, assigning distinct subtopics or source types to each agent',
          },
          {
            letter: 'C',
            text: 'Allow both agents to complete their parallel work, then have the coordinator deduplicate overlapping findings before passing to the synthesis agent',
          },
          {
            letter: 'D',
            text: 'Implement a shared state mechanism where agents log their current focus area, allowing other agents to dynamically avoid duplicating work in progress',
          },
        ],
        correct: 'B',
        explanation:
          'Having the coordinator explicitly partition the research space before delegation is the most effective approach because it addresses the root cause—unclear task boundaries—before any work begins. This preserves the benefits of parallel execution while preventing duplicated effort and wasted tokens.',
        wrongExplanations: {
          D: 'While a shared state mechanism could theoretically reduce overlap, it introduces unnecessary complexity, potential race conditions, and still allows some duplicated work before agents detect each other\'s focus areas. Proactive partitioning at the coordinator level is simpler and more reliable than reactive dynamic coordination between agents.',
        },
        studyArea:
          'Multi-Agent Research System — review Multi-Agent Orchestration concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.2',
      },
      {
        id: 9,
        text: 'Production logs reveal a consistent pattern: requests to "analyze the quarterly report I uploaded" are routed to the web search agent 45% of the time instead of the document analysis agent. Examining the tool definitions, you find the web search agent has an analyze_content tool described as "analyzes content and extracts key information," while the document analysis agent has an analyze_document tool described as "analyzes documents and extracts key information." How should you address this misrouting?',
        options: [
          {
            letter: 'A',
            text: 'Rename the web search tool to extract_web_results and update its description to "processes and returns information retrieved from web searches and URLs."',
          },
          {
            letter: 'B',
            text: 'Add few-shot examples to the coordinator\'s prompt showing correct routing: "User uploads quarterly report \u2192 document analysis agent" and "User asks about a webpage \u2192 web search agent."',
          },
          {
            letter: 'C',
            text: 'Expand the document analysis tool\'s description to include example use cases like "Use for uploaded PDFs, Word documents, and spreadsheets" while leaving the web search tool unchanged.',
          },
          {
            letter: 'D',
            text: 'Add a pre-routing classifier that determines whether the user is referencing uploaded files or web content before the coordinator makes delegation decisions.',
          },
        ],
        correct: 'A',
        explanation:
          'Renaming the web search tool to `extract_web_results` and updating its description to clearly reference web searches and URLs directly addresses the root cause by eliminating the semantic overlap between the two tools\' names and descriptions. This makes each tool\'s purpose unambiguous, allowing the coordinator to correctly distinguish between document analysis and web search tasks.',
      },
      {
        id: 10,
        text: 'The document analysis agent discovers that two credible sources contain directly conflicting statistics on a key metric: one government report states 40% growth while an industry analysis states 12% growth. Both sources appear legitimate and the discrepancy could significantly affect the research conclusions. What\'s the most effective way for the document analysis agent to handle this?',
        options: [
          {
            letter: 'A',
            text: 'Apply source credibility heuristics to select the most likely accurate figure, complete the analysis using that value, and include a footnote mentioning the discrepancy.',
          },
          {
            letter: 'B',
            text: 'Include both figures in the analysis output without flagging them as conflicting, allowing the synthesis agent to determine which to use based on the broader research context.',
          },
          {
            letter: 'C',
            text: 'Complete the document analysis with both figures included, explicitly annotate the conflict with source attribution, and let the coordinator decide how to reconcile before passing to synthesis.',
          },
          {
            letter: 'D',
            text: 'Halt analysis and escalate to the coordinator immediately, asking it to determine which source is authoritative before the agent continues processing remaining documents.',
          },
        ],
        correct: 'C',
        explanation:
          'This is the most effective approach because it respects separation of concerns: the document analysis agent completes its primary task without blocking, preserves both conflicting data points with explicit source attribution, and appropriately defers the reconciliation decision to the coordinator, which has the broader context needed to resolve the conflict.',
      },
      {
        id: 11,
        text: 'Production monitoring reveals inconsistent synthesis quality. When aggregated results total ~75K tokens, the synthesis agent reliably cites information from the first 15K tokens (web search headlines and snippets) and the final 10K tokens (document analysis conclusions), but frequently omits critical findings that appear in the middle 50K tokens—even when those findings directly address the research question. How should you restructure the aggregated input?',
        options: [
          {
            letter: 'A',
            text: 'Stream subagent results to the synthesis agent incrementally, processing web search results first to completion before introducing document analysis findings.',
          },
          {
            letter: 'B',
            text: 'Implement rotation that alternates which subagent\'s results appear first across different research tasks, ensuring both sources receive primacy positioning equally over time.',
          },
          {
            letter: 'C',
            text: 'Summarize all subagent outputs to under 20K tokens total before aggregation, ensuring content stays within the model\'s reliable processing range.',
          },
          {
            letter: 'D',
            text: 'Place a key findings summary at the beginning of the aggregated input and organize detailed results with explicit section headers for easier navigation.',
          },
        ],
        correct: 'D',
        explanation:
          'Placing a key findings summary at the beginning leverages the primacy effect, ensuring critical information occupies the most reliably attended position. Adding explicit section headers throughout the aggregated input helps the model navigate and attend to middle-section content, directly mitigating the \'lost in the middle\' phenomenon.',
      },
      {
        id: 12,
        text: 'The web search subagent returns results for only 3 of 5 requested source categories (competitor websites and industry reports succeeded, but news archives and social media feeds timed out). The document analysis subagent successfully processed all provided documents. The synthesis subagent must now produce a findings summary from this mixed-quality input. What\'s the most effective error propagation strategy?',
        options: [
          {
            letter: 'A',
            text: 'Have the synthesis subagent return an error to the coordinator indicating incomplete upstream data, triggering a full retry or task failure.',
          },
          {
            letter: 'B',
            text: 'Structure the synthesis output with coverage annotations indicating which findings are well-supported versus which topic areas have gaps due to unavailable sources.',
          },
          {
            letter: 'C',
            text: 'Have the synthesis subagent request the coordinator retry the timed-out sources with extended timeouts before proceeding, ensuring complete data coverage before synthesis begins.',
          },
          {
            letter: 'D',
            text: 'Proceed with synthesis using only the successful sources, generating output without indicating which data was unavailable.',
          },
        ],
        correct: 'B',
        explanation:
          'Structuring the synthesis output with coverage annotations embodies graceful degradation with transparency, allowing downstream consumers and end users to understand which findings are well-supported and which topic areas have gaps. This approach preserves the value of completed work while propagating uncertainty information so informed decisions can be made about confidence levels.',
      },
      {
        id: 13,
        text: 'A colleague suggests having the document analysis agent send its output directly to the synthesis agent instead of routing through the coordinator. What is the main advantage of keeping the coordinator as the central hub for all subagent communication?',
        options: [
          {
            letter: 'A',
            text: 'The coordinator batches multiple subagent requests together, reducing the total number of API calls and overall latency',
          },
          {
            letter: 'B',
            text: 'Routing through the coordinator enables automatic retry logic that direct agent-to-agent calls cannot support',
          },
          {
            letter: 'C',
            text: 'The coordinator can observe all interactions, handle errors consistently, and decide what information each subagent should receive',
          },
          {
            letter: 'D',
            text: 'Subagents operate with isolated memory, and direct communication would require complex serialization that only the coordinator can perform',
          },
        ],
        correct: 'C',
        explanation:
          'This is correct. The coordinator pattern provides centralized visibility into all interactions, consistent error handling across the system, and fine-grained control over what information each subagent receives, which are the primary advantages of hub-and-spoke communication.',
      },
      {
        id: 14,
        text: 'After running the system on the topic "impact of AI on creative industries," you observe that each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarizes papers correctly, and the synthesis agent produces coherent output. However, the final reports cover only visual arts, completely missing music, writing, and film production. When you examine the coordinator\'s logs, you see it decomposed the topic into three subtasks: "AI in digital art creation," "AI in graphic design," and "AI in photography." What is the most likely root cause?',
        options: [
          {
            letter: 'A',
            text: 'The web search agent\'s queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.',
          },
          {
            letter: 'B',
            text: 'The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria.',
          },
          {
            letter: 'C',
            text: 'The coordinator agent\'s task decomposition is too narrow, resulting in subagent assignments that don\'t cover all relevant domains of the topic.',
          },
          {
            letter: 'D',
            text: 'The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.',
          },
        ],
        correct: 'C',
        explanation:
          'The coordinator decomposed "AI in creative industries" into only visual art subtasks (digital art, graphic design, photography), completely missing music, writing, and film. Each subagent executed its assigned task correctly — the problem is upstream in the task decomposition. The coordinator\'s narrow decomposition is the root cause, not the individual subagents\' execution.',
        studyArea: 'Multi-Agent Research System — review Task Decomposition concepts in the exam study guide.',
        studyAreaLink: '/domains/d1#task-1.2',
      },
    ],
  },
];

export function getQuizSection(id) {
  return quizSections.find((s) => s.id === id);
}

export function getAllQuizStats(getStatus) {
  let totalScore = 0,
    totalQuestions = 0,
    sectionsCompleted = 0;
  quizSections.forEach((s) => {
    const best = getStatus(`quiz:${s.id}:best`, null);
    if (best) {
      totalScore += best.score;
      totalQuestions += best.total;
      sectionsCompleted++;
    } else {
      totalQuestions += s.questions.length;
    }
  });
  return {
    totalScore,
    totalQuestions,
    sectionsCompleted,
    totalSections: quizSections.length,
  };
}
